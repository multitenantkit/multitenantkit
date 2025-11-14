import type { Adapters } from '@multitenantkit/domain-contracts';
import type {
    IUpdateOrganizationMemberRole,
    UpdateOrganizationMemberRoleInput,
    UpdateOrganizationMemberRoleOutput
} from '@multitenantkit/domain-contracts/organization-memberships';
import {
    type OrganizationMembership,
    UpdateOrganizationMemberRoleInputSchema,
    UpdateOrganizationMemberRoleOutputSchema
} from '@multitenantkit/domain-contracts/organization-memberships';
import type { FrameworkConfig, OperationContext } from '@multitenantkit/domain-contracts/shared';
import {
    type DomainError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * UpdateOrganizationMemberRole use case
 * Handles business logic for updating a organization member's role
 */
export class UpdateOrganizationMemberRole<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        UpdateOrganizationMemberRoleInput,
        UpdateOrganizationMemberRoleOutput,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IUpdateOrganizationMemberRole
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
            'organizationMembership-updateOrganizationMemberRole',
            adapters,
            frameworkConfig,
            UpdateOrganizationMemberRoleInputSchema,
            UpdateOrganizationMemberRoleOutputSchema as unknown as import('zod').ZodType<UpdateOrganizationMemberRoleOutput>,
            'Failed to update organization member role'
        );
    }

    protected async authorize(
        input: UpdateOrganizationMemberRoleInput,
        _context: OperationContext
    ): Promise<Result<void, DomainError>> {
        const organization = await this.adapters.persistence.organizationRepository.findById(
            input.organizationId
        );
        if (!organization) {
            return Result.fail(new NotFoundError('Organization', input.organizationId));
        }

        // Check if organization is archived (cannot update member roles in archived organization)
        if (organization.archivedAt) {
            return Result.fail(
                new ValidationError(
                    'Cannot update member roles in an archived organization',
                    'organizationId'
                )
            );
        }

        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);

        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }

        const existingUser = getUserResult.getValue();
        // Target membership must exist and be active
        const targetMembership =
            await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                input.targetUserId,
                input.organizationId
            );
        if (!targetMembership || targetMembership.leftAt || targetMembership.deletedAt) {
            return Result.fail(
                new NotFoundError(
                    'OrganizationMembership',
                    `${input.targetUserId}:${input.organizationId}`
                )
            );
        }
        // Prevent changing owner role
        if (organization.ownerUserId === input.targetUserId) {
            return Result.fail(
                new ValidationError(
                    'Organization owner role cannot be changed. Use transfer ownership instead.'
                )
            );
        }
        // Owner can assign any role; admin can only assign member
        const actorMembership =
            await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                existingUser.id,
                input.organizationId
            );
        const isOwner = organization.ownerUserId === existingUser.id;
        const isAdmin =
            !!actorMembership &&
            actorMembership.roleCode === 'admin' &&
            !!actorMembership.joinedAt &&
            !actorMembership.leftAt &&
            !actorMembership.deletedAt;
        const canAssignRole = input.roleCode === 'member' || isOwner;

        if (!isOwner && !(isAdmin && canAssignRole)) {
            return Result.fail(
                new UnauthorizedError('Insufficient permissions to assign this role')
            );
        }

        return Result.ok(undefined);
    }

    protected async executeBusinessLogic(
        input: UpdateOrganizationMemberRoleInput,
        context: OperationContext
    ): Promise<Result<UpdateOrganizationMemberRoleOutput, DomainError>> {
        // Re-fetch target membership to get its ID for deletion
        // Note: This check is redundant with authorize() but serves as defensive programming
        // against race conditions and ensures executeBusinessLogic can be safely called independently
        const targetMembership =
            await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                input.targetUserId,
                input.organizationId
            );
        if (!targetMembership) {
            return Result.fail(
                new NotFoundError(
                    'OrganizationMembership',
                    `${input.targetUserId}:${input.organizationId}`
                )
            );
        }
        const now = this.adapters.system.clock.now();
        const updatedMembership: OrganizationMembership = {
            ...targetMembership,
            roleCode: input.roleCode,
            updatedAt: now
        } as OrganizationMembership;
        const auditContext: OperationContext = {
            ...context,
            organizationId: input.organizationId,
            auditAction: 'UPDATE_ORGANIZATION_MEMBER_ROLE'
        };
        try {
            await this.adapters.persistence.uow.transaction(async (repos) => {
                await repos.organizationMemberships.update(updatedMembership as any, auditContext);
            });
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to update organization member role', undefined, {
                    originalError: error
                })
            );
        }

        const output = UpdateOrganizationMemberRoleOutputSchema.parse({
            ...updatedMembership
        });
        return Result.ok(output);
    }
}
