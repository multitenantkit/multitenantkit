import type { Adapters } from '@multitenantkit/domain-contracts';
import type { OrganizationMembership } from '@multitenantkit/domain-contracts/organization-memberships';
import type {
    CreateOrganizationInput,
    CreateOrganizationOutput,
    ICreateOrganization,
    Organization
} from '@multitenantkit/domain-contracts/organizations';
import {
    CreateOrganizationInputSchema,
    CreateOrganizationOutputSchema
} from '@multitenantkit/domain-contracts/organizations';
import type { OperationContext, ToolkitOptions } from '@multitenantkit/domain-contracts/shared';
import {
    type DomainError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import type { z } from 'zod';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * CreateOrganization use case
 * Handles the business logic for creating a new organization
 *
 * Generic support for custom fields:
 * @template TOrganizationCustomFields - Custom fields added to Organization
 */
export class CreateOrganization<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        CreateOrganizationInput & TOrganizationCustomFields,
        CreateOrganizationOutput,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements ICreateOrganization
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
        // Extract organization custom schema from toolkit options
        const customSchema = toolkitOptions?.organizations?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Build input schema with custom fields if provided
        const inputSchema = (customSchema
            ? CreateOrganizationInputSchema.and(customSchema.partial())
            : CreateOrganizationInputSchema) as unknown as z.ZodType<
            CreateOrganizationInput & TOrganizationCustomFields
        >;

        // Build output schema with custom fields if provided
        const outputSchema = (customSchema
            ? CreateOrganizationOutputSchema.merge(customSchema)
            : CreateOrganizationOutputSchema) as unknown as z.ZodType<CreateOrganizationOutput>;

        super(
            'organization-createOrganization',
            adapters,
            toolkitOptions,
            inputSchema,
            outputSchema,
            'Failed to create organization'
        );

        this.customSchema = customSchema;
    }

    protected async executeBusinessLogic(
        input: CreateOrganizationInput & TOrganizationCustomFields,
        context: OperationContext
    ): Promise<Result<CreateOrganizationOutput, DomainError>> {
        // 1. Business validation - e.g., ensure no conflicting organization constraints
        // Placeholder for name uniqueness etc. when name present in custom fields

        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);

        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }

        const existingUser = getUserResult.getValue();

        // 2. Generate ID and timestamp
        const organizationId = this.adapters.system.uuid.generate();
        const now = this.adapters.system.clock.now();

        // 3. Create Organization entity
        const organization: Organization & TOrganizationCustomFields = {
            id: organizationId,
            ...(input as any),
            ownerUserId: existingUser.id,
            createdAt: now,
            updatedAt: now
        } as any;

        // 4. Validate the organization data (base + custom)
        const organizationSchema = this.customSchema
            ? CreateOrganizationOutputSchema.strip().and(this.customSchema.strip())
            : CreateOrganizationOutputSchema.strip();
        const validation = organizationSchema.safeParse(organization);
        if (!validation.success) {
            const firstError = validation.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }
        const validatedOrganization = validation.data as Organization & TOrganizationCustomFields;

        // 5. Persist organization and owner membership using Unit of Work
        const auditContext: OperationContext = {
            ...context,
            organizationId: validatedOrganization.id,
            auditAction: 'CREATE_ORGANIZATION'
        };
        const membershipAuditContext: OperationContext = {
            ...context,
            organizationId: validatedOrganization.id,
            auditAction: 'ADD_ORGANIZATION_MEMBER'
        };

        try {
            await this.adapters.persistence.uow.transaction(async (repos) => {
                await repos.organizations.insert(validatedOrganization, auditContext);

                const ownerMembership: OrganizationMembership = {
                    id: this.adapters.system.uuid.generate(),
                    organizationId: validatedOrganization.id,
                    userId: validatedOrganization.ownerUserId,
                    username: existingUser.username,
                    roleCode: 'owner',
                    invitedAt: undefined,
                    joinedAt: now,
                    leftAt: undefined,
                    deletedAt: undefined,
                    createdAt: now,
                    updatedAt: now
                } as OrganizationMembership;

                await repos.organizationMemberships.insert(
                    ownerMembership as any,
                    membershipAuditContext
                );
            });
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to save organization', undefined, {
                    originalError: error
                })
            );
        }

        // 6. Return success; BaseUseCase will parse with output schema
        return Result.ok({ ...(validatedOrganization as any) } as CreateOrganizationOutput);
    }
}
