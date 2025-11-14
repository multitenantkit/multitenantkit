import type {
    DeleteUserInput,
    FrameworkConfig,
    IDeleteUser,
    OperationContext,
    Organization,
    OrganizationMembership,
    User
} from '@multitenantkit/domain-contracts';
import {
    type Adapters,
    DeleteUserInputSchema,
    type NotFoundError,
    OrganizationMembershipSchema,
    OrganizationSchema,
    UserSchema,
    ValidationError
} from '@multitenantkit/domain-contracts';
import { z } from 'zod';
import { Result } from '../../../shared/result';
import { BaseUseCase, UseCaseHelpers } from '../../../shared/use-case';

/**
 * DeleteUser use case
 * Handles the business logic for soft deleting a user
 * Sets the deletedAt timestamp without removing the user from the database
 *
 * Cascade behavior:
 * - Soft deletes all organizations owned by the user (sets deletedAt)
 * - Does NOT modify memberships in owned organizations (preserves state for future restore)
 * - Soft deletes memberships in organizations NOT owned by the user (sets leftAt AND deletedAt)
 *   because the user is conceptually "leaving" these organizations
 *
 * Semantic distinction for owned organizations:
 * - organization.deletedAt = organization was soft deleted (owner deleted)
 * - membership.deletedAt = null → membership was active, can be restored
 * - membership.deletedAt = set → membership was explicitly removed, should NOT be restored
 * - membership.leftAt = user voluntarily left before organization deletion
 *
 * Semantic distinction for non-owned organizations:
 * - membership.leftAt = user is leaving (being deleted)
 * - membership.deletedAt = user no longer exists
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization (for framework config compatibility)
 * @template TOrganizationMembershipCustomFields - Custom fields added to OrganizationMembership (for framework config compatibility)
 */
export class DeleteUser<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        DeleteUserInput,
        User & TUserCustomFields,
        ValidationError | NotFoundError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IDeleteUser
{
    constructor(
        adapters: Adapters<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >,
        frameworkConfig?: FrameworkConfig<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) {
        super(
            'user-deleteUser',
            adapters,
            frameworkConfig,
            DeleteUserInputSchema,
            z.any(), // No validation needed for output - domain entities are already type-safe
            'Failed to delete user'
        );
    }

    protected async executeBusinessLogic(
        input: DeleteUserInput,
        context: OperationContext
    ): Promise<Result<User & TUserCustomFields, ValidationError | NotFoundError>> {
        // 1. Get user by externalId
        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);
        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }
        const existingUser = getUserResult.getValue();

        // 2. Check if user is already deleted
        if (existingUser.deletedAt) {
            return Result.fail(new ValidationError('User is already deleted', 'userId'));
        }

        // 3. Build deleted user data (soft delete)
        const now = this.adapters.system.clock.now();

        const deletedUserData: User & TUserCustomFields = {
            ...existingUser,
            deletedAt: now,
            updatedAt: now
        };

        // 4. Validate the updated data
        const validationResult = UserSchema.strip().safeParse(deletedUserData);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        // Use validated and potentially transformed data from Zod
        const deletedUser = validationResult.data as User & TUserCustomFields;

        // 5. Persist the deleted user using Unit of Work (transaction) with audit context
        const auditContext = UseCaseHelpers.enrichAuditContext(
            context,
            'DELETE_USER',
            undefined // Users don't belong directly to a organization
        );

        await this.adapters.persistence.uow.transaction(async (repos) => {
            // 5.1. Save the soft-deleted user
            await repos.users.update(deletedUser, auditContext);

            // 5.2. Soft delete all organizations owned by this user (using internal user ID)
            const ownedOrganizations =
                await this.adapters.persistence.organizationRepository.findByOwner(existingUser.id);
            for (const organization of ownedOrganizations) {
                if (!organization.deletedAt) {
                    const deletedOrganization: Organization & TOrganizationCustomFields = {
                        ...organization,
                        deletedAt: now,
                        updatedAt: now
                    } as Organization & TOrganizationCustomFields;

                    // Validate the organization data
                    const organizationValidation =
                        OrganizationSchema.strip().safeParse(deletedOrganization);
                    if (organizationValidation.success) {
                        await repos.organizations.update(deletedOrganization as any, auditContext);
                    }

                    // 5.2.1. Do NOT modify memberships of owned organizations
                    // Rationale: Same as DeleteOrganization use case - preserving membership state
                    // allows future restore to distinguish between:
                    // - Active memberships (deletedAt=null) → should be restored
                    // - Explicitly deleted memberships (deletedAt set) → should NOT be restored
                    // - Voluntary departures (leftAt set) → historical record preserved
                }
            }

            // 5.3. Soft delete all organization memberships for this user in organizations where they are NOT the owner
            // NOTE: Here we DO set both leftAt AND deletedAt because:
            // - leftAt: the user is conceptually "leaving" all organizations they're part of
            // - deletedAt: the membership should be soft-deleted since the user no longer exists
            const userMemberships =
                await this.adapters.persistence.organizationMembershipRepository.findByUser(
                    existingUser.id
                );
            const ownedOrganizationIds = new Set(ownedOrganizations.map((t) => t.id));

            for (const membership of userMemberships) {
                // Skip memberships in owned organizations (those organizations were deleted in step 5.2)
                if (ownedOrganizationIds.has(membership.organizationId)) {
                    continue;
                }

                if (!membership.deletedAt && !membership.leftAt) {
                    const deletedMembership: OrganizationMembership = {
                        ...membership,
                        leftAt: now, // User is leaving (being deleted)
                        deletedAt: now,
                        updatedAt: now
                    };

                    // Validate the membership data
                    const membershipValidation =
                        OrganizationMembershipSchema.strip().safeParse(deletedMembership);
                    if (membershipValidation.success) {
                        await repos.organizationMemberships.update(
                            deletedMembership as any,
                            auditContext
                        );
                    }
                }
            }
        });

        // 6. Return deleted user
        return Result.ok(deletedUser);
    }
}
