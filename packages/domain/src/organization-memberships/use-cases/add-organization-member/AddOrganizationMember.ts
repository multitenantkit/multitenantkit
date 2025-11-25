import type { Adapters } from '@multitenantkit/domain-contracts';
import type {
    AddOrganizationMemberInput,
    AddOrganizationMemberOutput,
    IAddOrganizationMember
} from '@multitenantkit/domain-contracts/organization-memberships';
import {
    AddOrganizationMemberInputSchema,
    AddOrganizationMemberOutputSchema,
    type OrganizationMembership,
    OrganizationMembershipSchema
} from '@multitenantkit/domain-contracts/organization-memberships';
import type { OperationContext, ToolkitOptions } from '@multitenantkit/domain-contracts/shared';
import {
    ConflictError,
    type DomainError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import { z } from 'zod';
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
        AddOrganizationMemberInput & TOrganizationMembershipCustomFields,
        AddOrganizationMemberOutput,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IAddOrganizationMember
{
    private readonly membershipCustomSchema?: z.ZodObject<any>;

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
        // Extract organization membership custom schema from toolkit options
        const membershipCustomSchema = toolkitOptions?.organizationMemberships?.customFields
            ?.customSchema as z.ZodObject<any> | undefined;

        // Build input schema with membership custom fields if provided
        const inputSchema = (membershipCustomSchema
            ? AddOrganizationMemberInputSchema.and(membershipCustomSchema.partial())
            : AddOrganizationMemberInputSchema) as unknown as z.ZodType<
            AddOrganizationMemberInput & TOrganizationMembershipCustomFields
        >;

        super(
            'organizationMembership-addOrganizationMember',
            adapters,
            toolkitOptions,
            inputSchema,
            AddOrganizationMemberOutputSchema as unknown as z.ZodType<AddOrganizationMemberOutput>,
            'Failed to add organization member'
        );

        this.membershipCustomSchema = membershipCustomSchema;
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
        input: AddOrganizationMemberInput & TOrganizationMembershipCustomFields,
        context: OperationContext
    ): Promise<Result<AddOrganizationMemberOutput, DomainError>> {
        // 1. Extract custom fields from input
        const { principalExternalId, organizationId, username, roleCode, ...customFields } =
            input as any;
        const baseInput = { principalExternalId, organizationId, username, roleCode };

        // 2. Validate target user exists
        const targetUser = await this.adapters.persistence.userRepository.findByUsername(
            baseInput.username
        );

        const now = this.adapters.system.clock.now();

        let existingMembership: OrganizationMembership | null = null;
        // If user doesn't exist, just create the membership without user id
        if (targetUser) {
            // 3. Check if user already has a membership
            const existingMembershipDB =
                await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                    targetUser.id,
                    baseInput.organizationId
                );
            existingMembership = existingMembershipDB;

            if (existingMembership && !existingMembership.leftAt && !existingMembership.deletedAt) {
                return Result.fail(
                    new ConflictError(
                        'OrganizationMembership',
                        `${targetUser.id}:${baseInput.organizationId}`,
                        {
                            reason: 'User is already a member of this organization'
                        }
                    )
                );
            }
        }

        let membership: OrganizationMembership & TOrganizationMembershipCustomFields;

        if (existingMembership && !!existingMembership.leftAt && !existingMembership.deletedAt) {
            // 4a. Reactivate existing membership that was left
            const reactivatedMembershipBase: OrganizationMembership = {
                ...existingMembership,
                invitedAt: now,
                joinedAt: undefined,
                leftAt: undefined,
                deletedAt: undefined,
                updatedAt: now
            } as OrganizationMembership;

            // Merge base with custom fields
            const reactivatedMembership: OrganizationMembership &
                TOrganizationMembershipCustomFields = {
                ...reactivatedMembershipBase,
                ...(customFields as any)
            } as any;

            // Then update the role if it's different from current role
            membership =
                reactivatedMembership.roleCode !== baseInput.roleCode
                    ? { ...reactivatedMembership, roleCode: baseInput.roleCode, updatedAt: now }
                    : reactivatedMembership;
        } else {
            // 4b. Create new membership with custom fields
            const membershipId = this.adapters.system.uuid.generate();
            const membershipBase: OrganizationMembership = {
                id: membershipId,
                userId: targetUser?.id,
                username: baseInput.username,
                organizationId: baseInput.organizationId,
                roleCode: baseInput.roleCode,
                invitedAt: now,
                joinedAt: undefined,
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: now,
                updatedAt: now
            } as OrganizationMembership;

            // Merge base membership with custom fields
            membership = {
                ...membershipBase,
                ...(customFields as any)
            } as any;
        }

        // 5. Validate the membership data (base + custom) if custom schema exists
        if (this.membershipCustomSchema) {
            const membershipSchema = OrganizationMembershipSchema.and(this.membershipCustomSchema);

            const membershipValidation = membershipSchema.safeParse(membership);
            if (!membershipValidation.success) {
                const firstError = membershipValidation.error.errors[0];
                return Result.fail(
                    new ValidationError(
                        `Membership validation failed: ${firstError.message}`,
                        firstError.path.join('.')
                    )
                );
            }
        }

        // 6. Persist the entity (save or update) using Unit of Work (transaction) with audit context
        const auditContext: OperationContext = {
            ...context,
            organizationId: baseInput.organizationId,
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

        // 7. KEY PATTERN: Spread + Parse to guarantee contract
        const output = AddOrganizationMemberOutputSchema.parse({
            ...membership
        });

        return Result.ok(output);
    }
}
