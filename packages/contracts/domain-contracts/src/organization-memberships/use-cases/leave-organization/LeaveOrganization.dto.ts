import z from 'zod';
import { OrganizationMembershipSchema } from '../../entities';
import { UserSchema } from '../../../users';

/**
 * Input schema - user leaving their own organization
 */
export const LeaveOrganizationInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId, // User who wants to leave
    organizationId: OrganizationMembershipSchema.shape.organizationId
});

/**
 * Output schema - returns updated membership
 */
export const LeaveOrganizationOutputSchema = OrganizationMembershipSchema;

export type LeaveOrganizationInput = z.infer<typeof LeaveOrganizationInputSchema>;
export type LeaveOrganizationOutput = z.infer<typeof LeaveOrganizationOutputSchema>;
