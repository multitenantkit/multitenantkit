import type {
    DeleteOrganizationInput,
    FrameworkConfig,
    IDeleteOrganization,
    OperationContext,
    Organization
} from '@multitenantkit/domain-contracts';
import {
    type Adapters,
    DeleteOrganizationInputSchema,
    NotFoundError,
    OrganizationSchema,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts';
import type { DomainError } from '@multitenantkit/domain-contracts/shared/errors/index';
import type { z } from 'zod';
import { Result } from '../../../shared/result';
import { BaseUseCase, UseCaseHelpers } from '../../../shared/use-case';

/**
 * DeleteOrganization use case
 * Handles the business logic for soft deleting a organization
 * Sets the deletedAt timestamp without removing the organization from the database
 *
 * Cascade behavior:
 * - Does NOT modify organization memberships when deleting a organization
 *   This preserves the state of memberships for future restore:
 *   * Active memberships (deletedAt=null) can be restored
 *   * Deleted memberships (deletedAt set) were explicitly removed and should not be restored
 *   * Left memberships (leftAt set) show historical voluntary departures
 *
 * Semantic distinction:
 * - organization.deletedAt = organization was soft deleted
 * - membership.deletedAt = membership was explicitly deleted (RemoveOrganizationMember use case)
 * - membership.leftAt = user voluntarily left the organization (LeaveOrganization use case)
 *
 * Generic support for custom fields:
 * @template TOrganizationCustomFields - Custom fields added to Organization
 * @template TUserCustomFields - User custom fields (for framework config compatibility)
 * @template TOrganizationMembershipCustomFields - Membership custom fields (for framework config compatibility)
 */
export class DeleteOrganization<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        DeleteOrganizationInput,
        Organization & TOrganizationCustomFields,
        ValidationError | NotFoundError | UnauthorizedError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IDeleteOrganization
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
            'organization-deleteOrganization',
            adapters,
            frameworkConfig,
            DeleteOrganizationInputSchema,
            outputSchema,
            'Failed to delete organization'
        );
        this.customSchema = customSchema;
    }

    protected async authorize(
        input: DeleteOrganizationInput,
        _context: OperationContext
    ): Promise<Result<void, DomainError>> {
        // 1. Ensure organization exists for permission checks
        const organization = await this.adapters.persistence.organizationRepository.findById(
            input.organizationId
        );
        if (!organization) {
            return Result.fail(new NotFoundError('Organization', input.organizationId));
        }

        // 2. Get the user making the request
        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);
        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }

        const user = getUserResult.getValue();

        // 3. Check if user is the owner
        const isOwner = organization.ownerUserId === user.id;

        // 4. Authorize: ONLY the owner can delete the organization
        // Note: Unlike archive-organization, delete is more critical and restrictive
        if (!isOwner) {
            return Result.fail(
                new UnauthorizedError('Only the organization owner can delete the organization')
            );
        }

        return Result.ok(undefined);
    }

    protected async executeBusinessLogic(
        input: DeleteOrganizationInput,
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

        // 2. Check if organization is already deleted
        if (existingOrganization.deletedAt) {
            return Result.fail(
                new ValidationError('Organization is already deleted', 'organizationId')
            );
        }

        // 3. Build deleted organization data (soft delete)
        const now = this.adapters.system.clock.now();

        const deletedOrganizationData: Organization & TOrganizationCustomFields = {
            ...existingOrganization,
            deletedAt: now,
            updatedAt: now
        };

        // 4. Validate the updated data
        const validationSchema = this.customSchema
            ? OrganizationSchema.strip().and(this.customSchema.strip())
            : OrganizationSchema.strip();

        const validationResult = validationSchema.safeParse(deletedOrganizationData);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        // Use validated and potentially transformed data from Zod
        const deletedOrganization = validationResult.data as Organization &
            TOrganizationCustomFields;

        // 5. Persist the deleted organization using Unit of Work (transaction) with audit context
        const auditContext = UseCaseHelpers.enrichAuditContext(
            context,
            'DELETE_ORGANIZATION',
            input.organizationId
        );

        await this.adapters.persistence.uow.transaction(async (repos) => {
            // 5.1. Save the soft-deleted organization
            await repos.organizations.update(deletedOrganization, auditContext);

            // 5.2. Do NOT modify organization memberships
            // Rationale: Preserving membership state allows future restore to know:
            // - Which users were active members at deletion time (joinedAt set, leftAt null)
            // - Which users had pending invitations (invitedAt set, joinedAt null)
            // - Which users had left voluntarily (leftAt set) → historical record preserved
        });

        // 6. Return deleted organization
        return Result.ok(deletedOrganization);
    }
}
