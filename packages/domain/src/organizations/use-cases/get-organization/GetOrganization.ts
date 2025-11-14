import type { Adapters } from '@multitenantkit/domain-contracts';
import type {
    GetOrganizationInput,
    GetOrganizationOutput,
    IGetOrganization
} from '@multitenantkit/domain-contracts/organizations';
import {
    GetOrganizationInputSchema,
    GetOrganizationOutputSchema
} from '@multitenantkit/domain-contracts/organizations';
import type { FrameworkConfig, OperationContext } from '@multitenantkit/domain-contracts/shared';
import {
    type DomainError,
    NotFoundError,
    UnauthorizedError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import type { z } from 'zod';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * GetOrganization use case
 * Handles the business logic for retrieving a organization by ID
 *
 * Generic support for custom fields:
 * @template TOrganizationCustomFields - Custom fields added to Organization
 */
export class GetOrganization<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        GetOrganizationInput,
        GetOrganizationOutput & TOrganizationCustomFields,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IGetOrganization
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
        // Extract custom schema
        const customSchema = frameworkConfig?.organizations?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Build output schema with custom fields if provided
        const outputSchema = (customSchema
            ? GetOrganizationOutputSchema.merge(customSchema)
            : GetOrganizationOutputSchema) as unknown as z.ZodType<
            GetOrganizationOutput & TOrganizationCustomFields
        >;

        super(
            'organization-getOrganization',
            adapters,
            frameworkConfig,
            GetOrganizationInputSchema,
            outputSchema,
            'Failed to retrieve organization'
        );
    }

    protected async executeBusinessLogic(
        input: GetOrganizationInput,
        _context: OperationContext
    ): Promise<Result<GetOrganizationOutput & TOrganizationCustomFields, DomainError>> {
        // 1. Find organization by ID
        const organization = await this.adapters.persistence.organizationRepository.findById(
            input.organizationId
        );
        if (!organization) {
            return Result.fail(new NotFoundError('Organization', input.organizationId));
        }

        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);

        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }

        const existingUser = getUserResult.getValue();

        // 2. Verify permissions - organization owner or active organization members can access organization details
        const isOwner = organization.ownerUserId === existingUser.id;

        let isActiveMember = false;
        if (!isOwner) {
            const membershipDB =
                await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                    existingUser.id,
                    input.organizationId
                );
            isActiveMember =
                !!membershipDB &&
                !!membershipDB.joinedAt &&
                !membershipDB.leftAt &&
                !membershipDB.deletedAt;
        }

        if (!isOwner && !isActiveMember) {
            return Result.fail(
                new UnauthorizedError(
                    'Only organization owner or active organization members can access organization details'
                )
            );
        }

        // 3. Return data; BaseUseCase will parse
        return Result.ok(
            organization as unknown as GetOrganizationOutput & TOrganizationCustomFields
        );
    }
}
