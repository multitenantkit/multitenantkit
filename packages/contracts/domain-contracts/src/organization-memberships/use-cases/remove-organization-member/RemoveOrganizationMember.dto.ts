import z from 'zod';
import { OrganizationMembershipSchema } from '../../entities';
import { UserSchema } from '../../../users';

/**
 * Input schema - includes userId for ownership validation
 */
export const RemoveOrganizationMemberInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId, // Actor user ID
    organizationId: OrganizationMembershipSchema.shape.organizationId,
    targetUser: z.string(), // Target user ID or username to remove
    removeByUsername: z.boolean().optional()
});

/**
 * Output schema - void for removal operations
 */
export const RemoveOrganizationMemberOutputSchema = z.void();

export type RemoveOrganizationMemberInput = z.infer<typeof RemoveOrganizationMemberInputSchema>;
export type RemoveOrganizationMemberOutput = z.infer<typeof RemoveOrganizationMemberOutputSchema>;
