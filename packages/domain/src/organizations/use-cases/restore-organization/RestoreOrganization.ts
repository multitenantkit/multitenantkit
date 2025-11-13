import { z } from 'zod';
import type {
    RestoreOrganizationInput,
    IRestoreOrganization,
    Organization,
    OperationContext,
    FrameworkConfig
} from '@multitenantkit/domain-contracts';
import {
    RestoreOrganizationInputSchema,
    OrganizationSchema,
    ValidationError,
    NotFoundError,
    Adapters
} from '@multitenantkit/domain-contracts';
import { Result } from '../../../shared/result';
import { BaseUseCase, UseCaseHelpers } from '../../../shared/use-case';

/**
 * RestoreOrganization use case
 * Handles the business logic for restoring an archived organization
 * Clears the archivedAt timestamp to make the organization active again
 *
 * Business rules:
 * - Only the organization owner can restore the organization
 * - The owner must be an active user (not soft-deleted)
 * - The organization must be currently archived (archivedAt set)
 * - Deleted organizations (deletedAt set) cannot be restored through this use case
 *
 * Membership behavior:
 * - Does NOT modify organization memberships during restore
 *   Active memberships automatically become active again when organization is restored
 *
 * Generic support for custom fields:
 * @template TOrganizationCustomFields - Custom fields added to Organization
 * @template TUserCustomFields - User custom fields (for framework config compatibility)
 * @template TOrganizationMembershipCustomFields - Membership custom fields (for framework config compatibility)
 */
export class RestoreOrganization<
        TOrganizationCustomFields = {},
        TUserCustomFields = {},
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        RestoreOrganizationInput,
        Organization & TOrganizationCustomFields,
        ValidationError | NotFoundError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IRestoreOrganization
{
    private readonly customSchema?: z.ZodObject<any>;

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
        // Extract custom schema from framework config
        const customSchema = frameworkConfig?.organizations?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Extend output schema with custom fields if provided
        const outputSchema = customSchema
            ? (OrganizationSchema.merge(customSchema) as unknown as z.ZodType<
                  Organization & TOrganizationCustomFields
              >)
            : (OrganizationSchema as unknown as z.ZodType<
                  Organization & TOrganizationCustomFields
              >);

        super(
            'organization-restoreOrganization',
            adapters,
            frameworkConfig,
            RestoreOrganizationInputSchema,
            outputSchema,
            'Failed to restore organization'
        );
        this.customSchema = customSchema;
    }

    protected async executeBusinessLogic(
        input: RestoreOrganizationInput,
        context: OperationContext
    ): Promise<Result<Organization & TOrganizationCustomFields, ValidationError | NotFoundError>> {
        // 1. Find existing organization
        const organizationResult = await UseCaseHelpers.findByIdOrFail(
            this.adapters.persistence.organizationRepository,
            input.organizationId,
            'Organization'
        );
        if (organizationResult.isFailure) {
            return organizationResult as unknown as Result<
                Organization & TOrganizationCustomFields,
                NotFoundError
            >;
        }

        const existingOrganization = organizationResult.getValue() as Organization &
            TOrganizationCustomFields;

        // 2. Check if organization is NOT archived (cannot restore a non-archived organization)
        if (!existingOrganization.archivedAt) {
            return Result.fail(
                new ValidationError('Organization is not archived', 'organizationId')
            );
        }

        // 3. Check if organization is deleted (deleted organizations cannot be restored)
        if (existingOrganization.deletedAt) {
            return Result.fail(
                new ValidationError(
                    'Deleted organizations cannot be restored through this use case',
                    'organizationId'
                )
            );
        }

        // 4. Authorize: Only the owner can restore the organization
        if (existingOrganization.ownerUserId !== context.actorUserId) {
            return Result.fail(
                new ValidationError(
                    'Only the organization owner can restore the organization',
                    'actorUserId'
                )
            );
        }

        // 5. Verify the owner is an active user (not soft-deleted)
        const ownerResult = await UseCaseHelpers.findByIdOrFail(
            this.adapters.persistence.userRepository,
            existingOrganization.ownerUserId,
            'User'
        );
        if (ownerResult.isFailure) {
            return ownerResult as unknown as Result<
                Organization & TOrganizationCustomFields,
                NotFoundError
            >;
        }

        const owner = ownerResult.getValue();
        if (owner.deletedAt) {
            return Result.fail(
                new ValidationError(
                    'Cannot restore organization: owner user is deleted',
                    'ownerUserId'
                )
            );
        }

        // 6. Build restored organization data (clear archivedAt)
        const now = this.adapters.system.clock.now();

        const restoredOrganizationData: Organization & TOrganizationCustomFields = {
            ...existingOrganization,
            archivedAt: undefined,
            updatedAt: now
        };

        // 7. Validate the updated data
        const validationSchema = this.customSchema
            ? OrganizationSchema.strip().and(this.customSchema.strip())
            : OrganizationSchema.strip();

        const validationResult = validationSchema.safeParse(restoredOrganizationData);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        // Use validated and potentially transformed data from Zod
        const restoredOrganization = validationResult.data as Organization &
            TOrganizationCustomFields;

        // 8. Persist the restored organization using Unit of Work (transaction) with audit context
        const auditContext = UseCaseHelpers.enrichAuditContext(
            context,
            'RESTORE_ORGANIZATION',
            input.organizationId
        );

        await this.adapters.persistence.uow.transaction(async (repos) => {
            // 8.1. Save the restored organization
            await repos.organizations.update(restoredOrganization as any, auditContext);

            // 8.2. Do NOT modify organization memberships
            // Rationale: Memberships with deletedAt=null will automatically become active
            // Active memberships automatically become active again when organization is restored
            // - Active memberships (deletedAt=null) → become active again automatically
            // - Deleted memberships (deletedAt set) → remain deleted
            // - Left memberships (leftAt set) → remain as historical records
        });

        // 9. Return restored organization
        return Result.ok(restoredOrganization);
    }
}
