import type { Adapters } from '@multitenantkit/domain-contracts';
import type {
    AddOrganizationMemberInput,
    AddOrganizationMemberOutput,
    IAddOrganizationMember
} from '@multitenantkit/domain-contracts/organization-memberships';
import {
    AddOrganizationMemberInputSchema,
    AddOrganizationMemberOutputSchema,
    type OrganizationMembership
} from '@multitenantkit/domain-contracts/organization-memberships';
import type { FrameworkConfig, OperationContext } from '@multitenantkit/domain-contracts/shared';
import {
    ConflictError,
    type DomainError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * AddOrganizationMember use case
 * Handles business logic for adding a user to a organization
 *
 * Generic support for custom fields:
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository (for consistency)
 */
export class AddOrganizationMember<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        AddOrganizationMemberInput,
        AddOrganizationMemberOutput,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IAddOrganizationMember
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
            'organizationMembership-addOrganizationMember',
            adapters,
            frameworkConfig,
            AddOrganizationMemberInputSchema,
            AddOrganizationMemberOutputSchema as unknown as import('zod').ZodType<AddOrganizationMemberOutput>,
            'Failed to add organization member'
        );
    }

    protected async authorize(
        input: AddOrganizationMemberInput,
        _context: OperationContext
    ): Promise<Result<void, DomainError>> {
        // Ensure organization exists for permission checks
        const organization = await this.adapters.persistence.organizationRepository.findById(
            input.organizationId
        );
        if (!organization) {
            return Result.fail(new NotFoundError('Organization', input.organizationId));
        }

        // Check if organization is archived (cannot add members to archived organization)
        if (organization.archivedAt) {
            return Result.fail(
                new ValidationError(
                    'Cannot add members to an archived organization',
                    'organizationId'
                )
            );
        }

        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);

        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }

        const existingUser = getUserResult.getValue();

        // Owner can always add members
        const isOwner = organization.ownerUserId === existingUser.id;

        // Admin can add members (but not other admins/owners)
        const actorMembership =
            await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                existingUser.id,
                input.organizationId
            );
        const isAdmin =
            !!actorMembership &&
            actorMembership.roleCode === 'admin' &&
            !!actorMembership.joinedAt &&
            !actorMembership.leftAt &&
            !actorMembership.deletedAt;
        const canAddRole = input.roleCode === 'member' || isOwner;

        if (!isOwner && !(isAdmin && canAddRole)) {
            return Result.fail(
                new UnauthorizedError('Only organization owners and admins can add members')
            );
        }

        return Result.ok(undefined);
    }

    protected async executeBusinessLogic(
        input: AddOrganizationMemberInput,
        context: OperationContext
    ): Promise<Result<AddOrganizationMemberOutput, DomainError>> {
        // 1. Validate target user exists
        const targetUser = await this.adapters.persistence.userRepository.findByUsername(
            input.username
        );

        const now = this.adapters.system.clock.now();

        let existingMembership: OrganizationMembership | null = null;
        // If user doesn't exist, just create the membership without user id
        if (targetUser) {
            // 2. Check if user already has a membership
            const existingMembershipDB =
                await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                    targetUser.id,
                    input.organizationId
                );
            existingMembership = existingMembershipDB;

            if (existingMembership && !existingMembership.leftAt && !existingMembership.deletedAt) {
                return Result.fail(
                    new ConflictError(
                        'OrganizationMembership',
                        `${targetUser.id}:${input.organizationId}`,
                        {
                            reason: 'User is already a member of this organization'
                        }
                    )
                );
            }
        }

        let membership: OrganizationMembership;

        if (existingMembership && !!existingMembership.leftAt && !existingMembership.deletedAt) {
            // 4a. Reactivate existing membership that was left
            const reactivatedMembership: OrganizationMembership = {
                ...existingMembership,
                invitedAt: now,
                joinedAt: undefined,
                leftAt: undefined,
                deletedAt: undefined,
                updatedAt: now
            } as OrganizationMembership;

            // Then update the role if it's different from current role
            membership =
                reactivatedMembership.roleCode !== input.roleCode
                    ? { ...reactivatedMembership, roleCode: input.roleCode, updatedAt: now }
                    : reactivatedMembership;
        } else {
            // 4b. Create new membership
            const membershipId = this.adapters.system.uuid.generate();
            membership = {
                id: membershipId,
                userId: targetUser?.id,
                username: input.username,
                organizationId: input.organizationId,
                roleCode: input.roleCode,
                invitedAt: now,
                joinedAt: undefined,
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: now,
                updatedAt: now
            } as OrganizationMembership;
        }

        // 5. Persist the entity (save or update) using Unit of Work (transaction) with audit context
        const auditContext: OperationContext = {
            ...context,
            organizationId: input.organizationId,
            auditAction: 'ADD_ORGANIZATION_MEMBER'
        };

        try {
            await this.adapters.persistence.uow.transaction(async (repos) => {
                if (
                    existingMembership &&
                    !!existingMembership.leftAt &&
                    !existingMembership.deletedAt
                ) {
                    await repos.organizationMemberships.update(membership as any, auditContext);
                } else {
                    await repos.organizationMemberships.insert(membership as any, auditContext);
                }
            });
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to save organization membership', undefined, {
                    originalError: error
                })
            );
        }

        // 6. KEY PATTERN: Spread + Parse to guarantee contract
        const output = AddOrganizationMemberOutputSchema.parse({
            ...membership
        });

        return Result.ok(output);
    }
}
