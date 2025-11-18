import type { Adapters } from '@multitenantkit/domain-contracts';
import type {
    ILeaveOrganization,
    LeaveOrganizationInput,
    LeaveOrganizationOutput
} from '@multitenantkit/domain-contracts/organization-memberships';
import {
    LeaveOrganizationInputSchema,
    LeaveOrganizationOutputSchema,
    type OrganizationMembership
} from '@multitenantkit/domain-contracts/organization-memberships';
import type { OperationContext, ToolkitOptions } from '@multitenantkit/domain-contracts/shared';
import {
    type DomainError,
    NotFoundError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * LeaveOrganization use case
 * Handles business logic for a user leaving a organization
 */
export class LeaveOrganization<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        LeaveOrganizationInput,
        LeaveOrganizationOutput,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements ILeaveOrganization
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
        super(
            'organizationMembership-leaveOrganization',
            adapters,
            toolkitOptions,
            LeaveOrganizationInputSchema,
            LeaveOrganizationOutputSchema as unknown as import('zod').ZodType<LeaveOrganizationOutput>,
            'Failed to leave organization'
        );
    }

    protected async executeBusinessLogic(
        input: LeaveOrganizationInput,
        context: OperationContext
    ): Promise<Result<LeaveOrganizationOutput, DomainError>> {
        // 1. Validate organization exists
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

        // 2. Validate user membership exists
        const membership =
            await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                existingUser.id,
                input.organizationId
            );
        if (!membership || membership.leftAt) {
            return Result.fail(
                new NotFoundError(
                    'OrganizationMembership',
                    `${existingUser.id}:${input.organizationId}`
                )
            );
        }

        // 3. Prevent owner from leaving (must transfer ownership first)
        if (organization.ownerUserId === existingUser.id) {
            return Result.fail(
                new ValidationError('Organization owner cannot leave. Transfer ownership first.')
            );
        }

        // 4. Leave the organization (immutably)
        const now = this.adapters.system.clock.now();
        const leftMembership: OrganizationMembership = {
            ...membership,
            leftAt: now,
            deletedAt: undefined,
            updatedAt: now
        } as OrganizationMembership;

        // 5. Persist the updated entity with audit context
        const auditContext: OperationContext = {
            ...context,
            organizationId: input.organizationId,
            auditAction: 'LEAVE_ORGANIZATION'
        };

        try {
            await this.adapters.persistence.uow.transaction(async (repos) => {
                await repos.organizationMemberships.update(leftMembership as any, auditContext);
            });
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to leave organization', undefined, {
                    originalError: error
                })
            );
        }

        // 6. KEY PATTERN: Spread + Parse to guarantee contract
        const output = LeaveOrganizationOutputSchema.parse({
            ...leftMembership
        });

        return Result.ok(output);
    }
}
