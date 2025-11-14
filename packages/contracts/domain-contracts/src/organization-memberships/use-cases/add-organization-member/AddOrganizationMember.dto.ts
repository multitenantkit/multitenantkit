import z from 'zod';
import { UserSchema } from '../../../users';
import { OrganizationMembershipSchema } from '../../entities';

/**
 * Input schema - includes userId for ownership validation
 */
export const AddOrganizationMemberInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId, // Actor user ID
    organizationId: OrganizationMembershipSchema.shape.organizationId,
    username: UserSchema.shape.username, // Target username
    roleCode: OrganizationMembershipSchema.shape.roleCode
});

/**
 * Output schema - reuses domain schema directly
 */
export const AddOrganizationMemberOutputSchema = OrganizationMembershipSchema;

export type AddOrganizationMemberInput = z.infer<typeof AddOrganizationMemberInputSchema>;
export type AddOrganizationMemberOutput = z.infer<typeof AddOrganizationMemberOutputSchema>;
