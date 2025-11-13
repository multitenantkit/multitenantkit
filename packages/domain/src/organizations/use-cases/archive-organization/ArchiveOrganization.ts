import { z } from 'zod';
import type {
    ArchiveOrganizationInput,
    IArchiveOrganization,
    Organization,
    OperationContext,
    FrameworkConfig,
    OrganizationMembership
} from '@multitenantkit/domain-contracts';
import {
    ArchiveOrganizationInputSchema,
    OrganizationSchema,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    Adapters,
    OrganizationMembershipSchema
} from '@multitenantkit/domain-contracts';
import { Result } from '../../../shared/result';
import { BaseUseCase, UseCaseHelpers } from '../../../shared/use-case';
import type { DomainError } from '@multitenantkit/domain-contracts/shared/errors/index';

/**
 * ArchiveOrganization use case
 * Handles the business logic for archiving an organization
 * Sets the archivedAt timestamp without removing the organization from the database
 *
 * Authorization:
 * - Only organization owners and admins can archive an organization
 *
 * Cascade behavior:
 * - Does NOT modify organization memberships when archiving an organization
 *   This preserves the state of memberships for future restore:
 *   * Active memberships (deletedAt=null) can remain active
 *   * Deleted memberships (deletedAt set) were explicitly removed
 *   * Left memberships (leftAt set) show historical voluntary departures
 *
 * Semantic distinction:
 * - organization.archivedAt = organization was archived (can be restored)
 * - organization.deletedAt = organization was soft deleted (permanent)
 * - membership.deletedAt = membership was explicitly deleted (RemoveOrganizationMember use case)
 * - membership.leftAt = user voluntarily left the organization (LeaveOrganization use case)
 *
 * Generic support for custom fields:
 * @template TOrganizationCustomFields - Custom fields added to Organization
 * @template TUserCustomFields - User custom fields (for framework config compatibility)
 * @template TOrganizationMembershipCustomFields - Membership custom fields (for framework config compatibility)
 */
export class ArchiveOrganization<
        TOrganizationCustomFields = {},
        TUserCustomFields = {},
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        ArchiveOrganizationInput,
        Organization & TOrganizationCustomFields,
        ValidationError | NotFoundError | UnauthorizedError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IArchiveOrganization
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
            'organization-archiveOrganization',
            adapters,
            frameworkConfig,
            ArchiveOrganizationInputSchema,
            outputSchema,
            'Failed to archive organization'
        );
        this.customSchema = customSchema;
    }

    protected async authorize(
        input: ArchiveOrganizationInput,
        context: OperationContext
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

        // 4. Check if user is an admin
        const actorMembership =
            await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                user.id,
                input.organizationId
            );
        const isAdmin =
            !!actorMembership &&
            actorMembership.roleCode === 'admin' &&
            !!actorMembership.joinedAt &&
            !actorMembership.leftAt &&
            !actorMembership.deletedAt;

        // 5. Authorize: Only owners and admins can archive
        if (!isOwner && !isAdmin) {
            return Result.fail(
                new UnauthorizedError(
                    'Only organization owners and admins can archive the organization'
                )
            );
        }

        return Result.ok(undefined);
    }

    protected async executeBusinessLogic(
        input: ArchiveOrganizationInput,
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

        // 2. Check if organization is already archived
        if (existingOrganization.archivedAt) {
            return Result.fail(
                new ValidationError('Organization is already archived', 'organizationId')
            );
        }

        // 3. Check if organization is deleted (cannot archive a deleted organization)
        if (existingOrganization.deletedAt) {
            return Result.fail(
                new ValidationError('Cannot archive a deleted organization', 'organizationId')
            );
        }

        // 4. Build archived organization data
        const now = this.adapters.system.clock.now();

        const archivedOrganizationData: Organization & TOrganizationCustomFields = {
            ...existingOrganization,
            archivedAt: now,
            updatedAt: now
        };

        // 5. Validate the updated data
        const validationSchema = this.customSchema
            ? OrganizationSchema.strip().and(this.customSchema.strip())
            : OrganizationSchema.strip();

        const validationResult = validationSchema.safeParse(archivedOrganizationData);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        // Use validated and potentially transformed data from Zod
        const archivedOrganization = validationResult.data as Organization &
            TOrganizationCustomFields;

        // 6. Persist the archived organization using Unit of Work (transaction) with audit context
        const auditContext = UseCaseHelpers.enrichAuditContext(
            context,
            'ARCHIVE_ORGANIZATION',
            input.organizationId
        );

        await this.adapters.persistence.uow.transaction(async (repos) => {
            // 6.1. Save the archived organization
            await repos.organizations.update(archivedOrganization, auditContext);

            // 6.2. Do NOT modify organization memberships
            // Rationale: Preserving membership state allows the organization to be restored later
            // - Active memberships remain active
            // - Deleted memberships remain deleted
            // - Left memberships remain as historical records
        });

        // 7. Return archived organization
        return Result.ok(archivedOrganization);
    }
}
