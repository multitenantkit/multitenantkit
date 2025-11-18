import type { Adapters } from '@multitenantkit/domain-contracts';
import type {
    IRemoveOrganizationMember,
    OrganizationMembership,
    RemoveOrganizationMemberInput,
    RemoveOrganizationMemberOutput
} from '@multitenantkit/domain-contracts/organization-memberships';
import {
    RemoveOrganizationMemberInputSchema,
    RemoveOrganizationMemberOutputSchema
} from '@multitenantkit/domain-contracts/organization-memberships';
import type { OperationContext, ToolkitOptions } from '@multitenantkit/domain-contracts/shared';
import {
    type DomainError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * RemoveOrganizationMember use case
 * Handles business logic for removing a user from a organization
 */
export class RemoveOrganizationMember<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        RemoveOrganizationMemberInput,
        RemoveOrganizationMemberOutput,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IRemoveOrganizationMember
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
            'organizationMembership-removeOrganizationMember',
            adapters,
            toolkitOptions,
            RemoveOrganizationMemberInputSchema,
            RemoveOrganizationMemberOutputSchema,
            'Failed to remove organization member'
        );
    }

    protected async authorize(
        input: RemoveOrganizationMemberInput,
        _context: OperationContext
    ): Promise<Result<void, DomainError>> {
        // Organization must exist
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

        // Target membership must exist and be active (not left)
        let targetMembership: OrganizationMembership | null;
        if (!input.removeByUsername) {
            targetMembership =
                await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                    input.targetUser,
                    input.organizationId
                );
        } else {
            targetMembership =
                await this.adapters.persistence.organizationMembershipRepository.findByUsernameAndOrganizationId(
                    input.targetUser,
                    input.organizationId
                );
        }
        if (!targetMembership || targetMembership.leftAt || targetMembership.deletedAt) {
            return Result.fail(
                new NotFoundError(
                    'OrganizationMembership',
                    `${input.targetUser}:${input.organizationId}`
                )
            );
        }

        // Owner cannot be removed
        if (organization.ownerUserId === targetMembership.userId) {
            return Result.fail(
                new ValidationError(
                    'Organization owner cannot be removed. Transfer ownership first.'
                )
            );
        }

        // Actor permissions: owner can remove anyone; admin can remove only members
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
        const targetIsMember = targetMembership.roleCode === 'member';

        if (!(isOwner || (isAdmin && targetIsMember))) {
            return Result.fail(
                new UnauthorizedError('Insufficient permissions to remove this member')
            );
        }

        return Result.ok(undefined);
    }

    protected async executeBusinessLogic(
        input: RemoveOrganizationMemberInput,
        context: OperationContext
    ): Promise<Result<RemoveOrganizationMemberOutput, DomainError>> {
        // Re-fetch target membership to get its ID for deletion
        let targetMembership: OrganizationMembership | null;

        if (!input.removeByUsername) {
            targetMembership =
                await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                    input.targetUser,
                    input.organizationId
                );
        } else {
            targetMembership =
                await this.adapters.persistence.organizationMembershipRepository.findByUsernameAndOrganizationId(
                    input.targetUser,
                    input.organizationId
                );
        }
        if (!targetMembership) {
            return Result.fail(
                new NotFoundError(
                    'OrganizationMembership',
                    `${input.targetUser}:${input.organizationId}`
                )
            );
        }

        const auditContext: OperationContext = {
            ...context,
            organizationId: input.organizationId,
            auditAction: 'REMOVE_ORGANIZATION_MEMBER'
        };

        try {
            await this.adapters.persistence.uow.transaction(async (repos) => {
                await repos.organizationMemberships.delete(targetMembership.id, auditContext);
            });
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to remove organization member', undefined, {
                    originalError: error
                })
            );
        }

        return Result.ok(undefined as RemoveOrganizationMemberOutput);
    }
}
