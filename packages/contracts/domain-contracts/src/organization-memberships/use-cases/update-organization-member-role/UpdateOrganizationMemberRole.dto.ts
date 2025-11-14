import z from 'zod';
import { UserSchema } from '../../../users';
import { OrganizationMembershipSchema } from '../../entities';

/**
 * Input schema - includes userId for ownership validation
 */
export const UpdateOrganizationMemberRoleInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId, // Actor user ID
    organizationId: OrganizationMembershipSchema.shape.organizationId,
    targetUserId: UserSchema.shape.id, // Target user ID
    roleCode: OrganizationMembershipSchema.shape.roleCode
});

/**
 * Output schema - returns updated membership
 */
export const UpdateOrganizationMemberRoleOutputSchema = OrganizationMembershipSchema;

export type UpdateOrganizationMemberRoleInput = z.infer<
    typeof UpdateOrganizationMemberRoleInputSchema
>;
export type UpdateOrganizationMemberRoleOutput = z.infer<
    typeof UpdateOrganizationMemberRoleOutputSchema
>;
