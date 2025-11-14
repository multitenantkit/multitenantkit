import type { Adapters, FrameworkConfig } from '@multitenantkit/domain-contracts';
import {
    type Organization,
    OrganizationSchema
} from '@multitenantkit/domain-contracts/organizations';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import {
    type DomainError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import type {
    IListUserOrganizations,
    ListUserOrganizationsInput
} from '@multitenantkit/domain-contracts/users';
import {
    ListUserOrganizationsInputSchema,
    ListUserOrganizationsOutputSchema
} from '@multitenantkit/domain-contracts/users';
import { z } from 'zod';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * ListUserOrganizations use case
 * Handles business logic for listing organizations where user is a member or owner
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization
 */
export class ListUserOrganizations<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        ListUserOrganizationsInput,
        Array<Organization & TOrganizationCustomFields>,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IListUserOrganizations
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
        // Extract organization custom schema from framework config if provided
        const customSchema = frameworkConfig?.organizations?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Extend base schema with custom fields if provided
        const outputSchema = (customSchema
            ? z.array(OrganizationSchema.merge(customSchema))
            : ListUserOrganizationsOutputSchema) as unknown as z.ZodType<
            Array<Organization & TOrganizationCustomFields>
        >;

        super(
            'user-listUserOrganizations',
            adapters,
            frameworkConfig,
            ListUserOrganizationsInputSchema,
            outputSchema,
            'Failed to list user organizations'
        );
    }

    protected async executeBusinessLogic(
        input: ListUserOrganizationsInput,
        _context: OperationContext
    ): Promise<Result<Array<Organization & TOrganizationCustomFields>, DomainError>> {
        // 1. Get user by externalId
        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);
        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }
        const user = getUserResult.getValue();

        try {
            // 2. Get all user memberships (active and non-left) using internal user ID
            const membershipsDB =
                await this.adapters.persistence.organizationMembershipRepository.findByUser(
                    user.id
                );
            const activeMemberships = membershipsDB.filter(
                (m) => m.joinedAt && !m.leftAt && !m.deletedAt
            );

            // 3. Get organizations for active memberships
            const organizationIds = activeMemberships.map((m) => m.organizationId);
            const organizations = [] as Array<Organization & TOrganizationCustomFields>;

            for (const organizationId of organizationIds) {
                const organizationDB =
                    await this.adapters.persistence.organizationRepository.findById(organizationId);
                if (organizationDB) {
                    const organization = organizationDB as Organization & TOrganizationCustomFields;
                    // Only include organizations that are not deleted
                    if (organization && !organization.deletedAt) {
                        organizations.push(organization);
                    }
                }
            }

            // 4. Also include organizations where user is owner (even without explicit membership)
            const ownedOrganizations =
                await this.adapters.persistence.organizationRepository.findByOwner(user.id);

            // Merge and deduplicate organizations
            const allOrganizations = [...organizations];
            for (const ownedOrganization of ownedOrganizations) {
                if (!allOrganizations.some((t) => t.id === ownedOrganization.id)) {
                    allOrganizations.push(
                        ownedOrganization as Organization & TOrganizationCustomFields
                    );
                }
            }

            // 5. Return raw data; BaseUseCase will parse with output schema
            return Result.ok(allOrganizations as Array<Organization & TOrganizationCustomFields>);
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to list user organizations', undefined, {
                    originalError: error
                })
            );
        }
    }
}
