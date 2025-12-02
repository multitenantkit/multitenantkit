import type {
    ITransferOrganizationOwnership,
    OperationContext,
    Organization,
    OrganizationMembership,
    ToolkitOptions,
    TransferOrganizationOwnershipInput,
    TransferOrganizationOwnershipOutput
} from '@multitenantkit/domain-contracts';
import {
    type Adapters,
    type NotFoundError,
    OrganizationMembershipSchema,
    OrganizationSchema,
    TransferOrganizationOwnershipInputSchema,
    TransferOrganizationOwnershipOutputSchema,
    ValidationError
} from '@multitenantkit/domain-contracts';
import type { z } from 'zod';
import { Result } from '../../../shared/result';
import { BaseUseCase, UseCaseHelpers } from '../../../shared/use-case';

/**
 * TransferOrganizationOwnership use case
 * Handles the business logic for transferring organization ownership from one user to another
 *
 * Business rules:
 * - Only the current owner can transfer ownership
 * - Both current and new owner must be active users (not soft-deleted)
 * - Organization must be active (not soft-deleted)
 * - Both users must have active memberships in the organization (not deleted, not left)
 * - New owner must be different from current owner
 *
 * Effects:
 * - Updates organization.ownerUserId to the new owner
 * - Updates old owner's membership roleCode to 'member'
 * - Updates new owner's membership roleCode to 'owner'
 *
 * Generic support for custom fields:
 * @template TOrganizationCustomFields - Custom fields added to Organization
 * @template TUserCustomFields - User custom fields (for toolkit options compatibility)
 * @template TOrganizationMembershipCustomFields - Membership custom fields (for toolkit options compatibility)
 */
export class TransferOrganizationOwnership<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        TransferOrganizationOwnershipInput,
        TransferOrganizationOwnershipOutput,
        ValidationError | NotFoundError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements ITransferOrganizationOwnership
{
    constructor(
        adapters: Adapters<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >,
        toolkitOptions?: ToolkitOptions<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) {
        // Extract custom schema if provided
        const customSchema = toolkitOptions?.organizations?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Build output schema with custom fields if provided
        const outputSchema = (customSchema
            ? TransferOrganizationOwnershipOutputSchema.merge(customSchema)
            : TransferOrganizationOwnershipOutputSchema) as unknown as z.ZodType<
            TransferOrganizationOwnershipOutput & TOrganizationCustomFields
        >;

        super(
            'organization-transferOrganizationOwnership',
            adapters,
            toolkitOptions,
            TransferOrganizationOwnershipInputSchema,
            outputSchema,
            'Failed to transfer organization ownership'
        );
    }

    protected async executeBusinessLogic(
        input: TransferOrganizationOwnershipInput,
        context: OperationContext
    ): Promise<Result<TransferOrganizationOwnershipOutput, ValidationError | NotFoundError>> {
        // 1. Find existing organization
        const organizationResult = await UseCaseHelpers.findByIdOrFail(
            this.adapters.persistence.organizationRepository,
            input.organizationId,
            'Organization'
        );
        if (organizationResult.isFailure) {
            return organizationResult as unknown as Result<
                TransferOrganizationOwnershipOutput,
                NotFoundError
            >;
        }

        const existingOrganization = organizationResult.getValue() as Organization &
            TOrganizationCustomFields;

        // 2. Check if organization is deleted (cannot transfer ownership of deleted organization)
        if (existingOrganization.deletedAt) {
            return Result.fail(
                new ValidationError(
                    'Cannot transfer ownership of a deleted organization',
                    'organizationId'
                )
            );
        }

        // 3. Check if organization is archived (cannot transfer ownership of archived organization)
        if (existingOrganization.archivedAt) {
            return Result.fail(
                new ValidationError(
                    'Cannot transfer ownership of an archived organization',
                    'organizationId'
                )
            );
        }

        // 4. Verify the current owner is an active user (not soft-deleted)
        const currentOwnerResult = await UseCaseHelpers.findByIdOrFail(
            this.adapters.persistence.userRepository,
            existingOrganization.ownerUserId,
            'User'
        );
        if (currentOwnerResult.isFailure) {
            return currentOwnerResult as unknown as Result<
                TransferOrganizationOwnershipOutput,
                NotFoundError
            >;
        }

        const currentOwner = currentOwnerResult.getValue();
        if (currentOwner.deletedAt) {
            return Result.fail(new ValidationError('Current owner user is deleted', 'ownerUserId'));
        }

        // 5. Authorize: Only the current owner can transfer ownership
        if (currentOwner.externalId !== context.externalId) {
            return Result.fail(
                new ValidationError(
                    'Only the current organization owner can transfer ownership',
                    'externalId'
                )
            );
        }

        // 6. Validate: New owner must be different from current owner
        if (input.newOwnerId === existingOrganization.ownerUserId) {
            return Result.fail(
                new ValidationError('New owner must be different from current owner', 'newOwnerId')
            );
        }

        // 7. Verify the new owner is an active user (not soft-deleted)
        const newOwnerResult = await UseCaseHelpers.findByIdOrFail(
            this.adapters.persistence.userRepository,
            input.newOwnerId,
            'User'
        );
        if (newOwnerResult.isFailure) {
            return newOwnerResult as unknown as Result<
                TransferOrganizationOwnershipOutput,
                NotFoundError
            >;
        }

        const newOwner = newOwnerResult.getValue();
        if (newOwner.deletedAt) {
            return Result.fail(new ValidationError('New owner user is deleted', 'newOwnerId'));
        }

        // 8. Verify current owner has an active membership
        const currentOwnerMemberships =
            await this.adapters.persistence.organizationMembershipRepository.findByUser(
                existingOrganization.ownerUserId
            );
        const currentOwnerMembership = currentOwnerMemberships.find(
            (m) => m.organizationId === input.organizationId && !m.deletedAt && !m.leftAt
        );

        if (!currentOwnerMembership) {
            return Result.fail(
                new ValidationError(
                    'Current owner does not have an active membership in the organization',
                    'ownerUserId'
                )
            );
        }

        // 9. Verify new owner has an active membership
        const newOwnerMemberships =
            await this.adapters.persistence.organizationMembershipRepository.findByUser(
                input.newOwnerId
            );
        const newOwnerMembership = newOwnerMemberships.find(
            (m) => m.organizationId === input.organizationId && !m.deletedAt && !m.leftAt
        );

        if (!newOwnerMembership) {
            return Result.fail(
                new ValidationError(
                    'New owner does not have an active membership in the organization',
                    'newOwnerId'
                )
            );
        }

        // 10. Build updated organization data
        const now = this.adapters.system.clock.now();

        const updatedOrganizationData: Organization & TOrganizationCustomFields = {
            ...existingOrganization,
            ownerUserId: input.newOwnerId,
            updatedAt: now
        };

        // 11. Validate the updated organization data
        const validationResult = OrganizationSchema.strip().safeParse(updatedOrganizationData);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        const updatedOrganization = validationResult.data as Organization &
            TOrganizationCustomFields;

        // 12. Build updated memberships
        const updatedOldOwnerMembership: OrganizationMembership = {
            ...currentOwnerMembership,
            roleCode: 'member',
            updatedAt: now
        };

        const updatedNewOwnerMembership: OrganizationMembership = {
            ...newOwnerMembership,
            roleCode: 'owner',
            updatedAt: now
        };

        // Validate membership data
        const oldOwnerMembershipValidation =
            OrganizationMembershipSchema.strip().safeParse(updatedOldOwnerMembership);
        if (!oldOwnerMembershipValidation.success) {
            const firstError = oldOwnerMembershipValidation.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        const newOwnerMembershipValidation =
            OrganizationMembershipSchema.strip().safeParse(updatedNewOwnerMembership);
        if (!newOwnerMembershipValidation.success) {
            const firstError = newOwnerMembershipValidation.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        // 13. Persist all changes using Unit of Work (transaction) with audit context
        const auditContext = UseCaseHelpers.enrichAuditContext(
            context,
            'TRANSFER_ORGANIZATION_OWNERSHIP',
            input.organizationId
        );

        await this.adapters.persistence.uow.transaction(async (repos) => {
            // 13.1. Update organization with new owner
            await repos.organizations.update(updatedOrganization as any, auditContext);

            // 13.2. Update old owner membership to 'member' role
            await repos.organizationMemberships.update(
                updatedOldOwnerMembership as any,
                auditContext
            );

            // 13.3. Update new owner membership to 'owner' role
            await repos.organizationMemberships.update(
                updatedNewOwnerMembership as any,
                auditContext
            );
        });

        // 14. Return success response with updated organization
        // BaseUseCase will parse with output schema
        return Result.ok(updatedOrganization as any as TransferOrganizationOwnershipOutput);
    }
}
