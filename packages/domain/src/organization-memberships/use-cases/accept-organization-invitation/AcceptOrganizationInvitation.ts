import type {
    AcceptOrganizationInvitationInput,
    AcceptOrganizationInvitationOutput,
    IAcceptOrganizationInvitation
} from '@multitenantkit/domain-contracts/organization-memberships';
import {
    AcceptOrganizationInvitationInputSchema,
    AcceptOrganizationInvitationOutputSchema
} from '@multitenantkit/domain-contracts/organization-memberships';
import { Result } from '../../../shared/result/Result';
import {
    DomainError,
    ValidationError,
    NotFoundError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import type { OperationContext, FrameworkConfig } from '@multitenantkit/domain-contracts/shared';
import { Adapters } from '@multitenantkit/domain-contracts';
import { OrganizationMembership } from '@multitenantkit/domain-contracts/organization-memberships';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * AcceptOrganizationInvitation use case
 * Handles business logic for accepting a pending organization invitation
 * 
 * Business Rules:
 * - User must be registered (have a userId)
 * - Invitation must exist and be pending (invitedAt set, joinedAt null)
 * - Username in invitation must match user's username
 * - Membership must not be already accepted, left, or deleted
 * 
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository
 */
export class AcceptOrganizationInvitation<
        TOrganizationCustomFields = {},
        TUserCustomFields = {},
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        AcceptOrganizationInvitationInput,
        AcceptOrganizationInvitationOutput,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IAcceptOrganizationInvitation
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
            'organizationMembership-acceptOrganizationInvitation',
            adapters,
            frameworkConfig,
            AcceptOrganizationInvitationInputSchema,
            AcceptOrganizationInvitationOutputSchema as unknown as import('zod').ZodType<AcceptOrganizationInvitationOutput>,
            'Failed to accept organization invitation'
        );
    }

    protected async executeBusinessLogic(
        input: AcceptOrganizationInvitationInput,
        context: OperationContext
    ): Promise<Result<AcceptOrganizationInvitationOutput, DomainError>> {
        // 1. Get the user accepting the invitation
        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);
        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }
        const user = getUserResult.getValue();

        // 2. Verify username matches (security check)
        if (user.username !== input.username) {
            return Result.fail(
                new ValidationError(
                    'Username mismatch: You can only accept invitations sent to your username',
                    'username'
                )
            );
        }

        // 3. Find pending invitation by username and organizationId
        const pendingInvitation =
            await this.adapters.persistence.organizationMembershipRepository.findByUsernameAndOrganizationId(
                input.username,
                input.organizationId
            );

        if (!pendingInvitation) {
            return Result.fail(
                new NotFoundError(
                    'OrganizationInvitation',
                    `${input.username}:${input.organizationId}`
                )
            );
        }

        // 4. Validate invitation is pending (not already accepted, left, or deleted)
        if (!pendingInvitation.invitedAt) {
            return Result.fail(
                new ValidationError(
                    'No pending invitation found for this organization',
                    'organizationId'
                )
            );
        }

        // Check leftAt and deletedAt BEFORE joinedAt, as these are terminal states
        if (pendingInvitation.leftAt) {
            return Result.fail(
                new ValidationError(
                    'Cannot accept invitation: membership was previously left',
                    'organizationId'
                )
            );
        }

        if (pendingInvitation.deletedAt) {
            return Result.fail(
                new ValidationError(
                    'Cannot accept invitation: invitation has been revoked',
                    'organizationId'
                )
            );
        }

        if (pendingInvitation.joinedAt) {
            return Result.fail(
                new ValidationError(
                    'Invitation has already been accepted',
                    'organizationId'
                )
            );
        }

        // 5. Update membership: set userId and joinedAt
        const now = this.adapters.system.clock.now();
        const acceptedMembership: OrganizationMembership = {
            ...pendingInvitation,
            userId: user.id,
            joinedAt: now,
            updatedAt: now
        } as OrganizationMembership;

        // 6. Persist using Unit of Work with audit context
        const auditContext: OperationContext = {
            ...context,
            organizationId: input.organizationId,
            auditAction: 'ACCEPT_ORGANIZATION_INVITATION'
        };

        try {
            await this.adapters.persistence.uow.transaction(async (repos) => {
                await repos.organizationMemberships.update(
                    acceptedMembership as any,
                    auditContext
                );
            });
        } catch (error) {
            return Result.fail(
                new ValidationError(
                    'Failed to accept organization invitation',
                    undefined,
                    { originalError: error }
                )
            );
        }

        // 7. Return success with updated membership
        const output = AcceptOrganizationInvitationOutputSchema.parse({
            ...acceptedMembership
        });

        return Result.ok(output);
    }
}
