import z from 'zod';
import { OrganizationMembershipSchema } from '../../entities';
import { UserSchema } from '../../../users';

/**
 * Input schema for AcceptOrganizationInvitation use case
 * The user accepts a pending invitation to join an organization
 */
export const AcceptOrganizationInvitationInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId, // User accepting the invitation
    organizationId: OrganizationMembershipSchema.shape.organizationId,
    username: UserSchema.shape.username // Username of the invitation (for verification)
});

/**
 * Output schema - returns the updated membership with joinedAt set
 */
export const AcceptOrganizationInvitationOutputSchema = OrganizationMembershipSchema;

export type AcceptOrganizationInvitationInput = z.infer<typeof AcceptOrganizationInvitationInputSchema>;
export type AcceptOrganizationInvitationOutput = z.infer<typeof AcceptOrganizationInvitationOutputSchema>;
