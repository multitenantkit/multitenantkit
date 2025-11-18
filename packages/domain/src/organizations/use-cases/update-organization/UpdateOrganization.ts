import type { Adapters } from '@multitenantkit/domain-contracts';
import type {
    IUpdateOrganization,
    Organization,
    UpdateOrganizationInput,
    UpdateOrganizationOutput
} from '@multitenantkit/domain-contracts/organizations';
import {
    OrganizationSchema,
    UpdateOrganizationInputSchema,
    UpdateOrganizationOutputSchema
} from '@multitenantkit/domain-contracts/organizations';
import type { OperationContext, ToolkitOptions } from '@multitenantkit/domain-contracts/shared';
import {
    type ConflictError,
    type NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import type { z } from 'zod';
import { Result } from '../../../shared/result';
import { BaseUseCase, UseCaseHelpers } from '../../../shared/use-case';

/**
 * UpdateOrganization use case
 * Handles the business logic for updating a organization (any fields including custom)
 * Note: Despite the name, this use case now handles updates to any organization property
 *
 * Generic support for custom fields:
 * @template TOrganizationCustomFields - Custom fields added to Organization
 * @template TUserCustomFields - User custom fields (for toolkit options compatibility)
 * @template TOrganizationMembershipCustomFields - Membership custom fields (for toolkit options compatibility)
 */
export class UpdateOrganization<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        UpdateOrganizationInput & TOrganizationCustomFields,
        UpdateOrganizationOutput,
        ValidationError | NotFoundError | ConflictError | UnauthorizedError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IUpdateOrganization
{
    private readonly customSchema?: z.ZodObject<any>;

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
        // Extract custom schema from toolkit options
        const customSchema = toolkitOptions?.organizations?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Build input schema with optional custom fields
        const inputSchema = (
            (customSchema
                ? UpdateOrganizationInputSchema.and(customSchema.partial())
                : UpdateOrganizationInputSchema) as unknown as z.ZodType<
                UpdateOrganizationInput & TOrganizationCustomFields
            >
        ).refine(
            (data: any) =>
                Object.keys(data).some(
                    (k) =>
                        k !== 'organizationId' && k !== 'userId' && (data as any)[k] !== undefined
                ),
            {
                message: 'At least one field must be provided for update',
                path: ['root']
            }
        );

        // Extend output schema with custom fields if provided
        const outputSchema = customSchema
            ? (UpdateOrganizationOutputSchema.merge(
                  customSchema
              ) as unknown as z.ZodType<UpdateOrganizationOutput>)
            : (UpdateOrganizationOutputSchema as unknown as z.ZodType<UpdateOrganizationOutput>);

        super(
            'organization-updateOrganization',
            adapters,
            toolkitOptions,
            inputSchema,
            outputSchema,
            'Failed to update organization'
        );

        // Store custom schema for use in validation
        this.customSchema = customSchema;
    }

    protected async executeBusinessLogic(
        input: UpdateOrganizationInput & TOrganizationCustomFields,
        context: OperationContext
    ): Promise<
        Result<
            UpdateOrganizationOutput,
            ValidationError | NotFoundError | ConflictError | UnauthorizedError
        >
    > {
        // 1. Find existing organization
        const organizationResult = await UseCaseHelpers.findByIdOrFail(
            this.adapters.persistence.organizationRepository,
            input.organizationId,
            'Organization'
        );
        if (organizationResult.isFailure) {
            return organizationResult as unknown as Result<UpdateOrganizationOutput, NotFoundError>;
        }
        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);
        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }
        const existingUser = getUserResult.getValue();
        const existingOrganizationDB = organizationResult.getValue();
        const existingOrganization: Organization & TOrganizationCustomFields =
            existingOrganizationDB as any;

        // 1.5. Verify organization is not deleted
        if (existingOrganization.deletedAt) {
            return Result.fail(
                new ValidationError('Cannot update a deleted organization', 'organizationId')
            );
        }

        // 2. Verify permissions - organization owner or admin can update organization
        const isOwner = existingOrganization.ownerUserId === existingUser.id;

        let isAdmin = false;
        if (!isOwner) {
            // Check if user is an admin organization member
            const membershipDB =
                await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                    existingUser.id,
                    input.organizationId
                );
            isAdmin =
                !!membershipDB &&
                !!membershipDB.joinedAt &&
                !membershipDB.leftAt &&
                !membershipDB.deletedAt &&
                membershipDB.roleCode === 'admin';
        }

        if (!isOwner && !isAdmin) {
            return Result.fail(
                new UnauthorizedError(
                    'Only organization owner or admin members can update organization'
                )
            );
        }

        // 3. Build updated organization data
        const now = this.adapters.system.clock.now();

        // Filter out undefined values from input to preserve existing values
        // Exclude organizationId and userId as they are not organization properties
        const { _organizationId, _userId, ...updateFields } = input as any;
        const definedInputFields = Object.fromEntries(
            Object.entries(updateFields).filter(([_, value]) => value !== undefined)
        ) as Partial<TOrganizationCustomFields>;

        // Merge existing organization with defined input fields
        const updatedOrganizationData: Organization & TOrganizationCustomFields = {
            ...existingOrganization,
            ...definedInputFields,
            updatedAt: now
        };

        // Validate the merged data with custom schema if provided
        const validationSchema = this.customSchema
            ? OrganizationSchema.strip().and(this.customSchema.strip())
            : OrganizationSchema.strip();

        const organizationValidationResult = validationSchema.safeParse(updatedOrganizationData);
        if (!organizationValidationResult.success) {
            const firstError = organizationValidationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        // Use validated and potentially transformed data from Zod
        const updatedOrganization = organizationValidationResult.data as Organization &
            TOrganizationCustomFields;

        // 4. Persist the updated organization using Unit of Work (transaction) with audit context
        const auditContext = UseCaseHelpers.enrichAuditContext(
            context,
            'UPDATE_ORGANIZATION',
            input.organizationId
        );

        await this.adapters.persistence.uow.transaction(async (repos) => {
            await repos.organizations.update(updatedOrganization, auditContext);
        });

        // 5. Return success response; BaseUseCase will parse output
        return Result.ok(updatedOrganization as unknown as UpdateOrganizationOutput);
    }
}
