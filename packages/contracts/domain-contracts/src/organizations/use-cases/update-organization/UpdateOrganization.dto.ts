import z from 'zod';
import { OrganizationSchema } from '../../entities';
import { UserSchema } from '../../../users/entities';

export const UpdateOrganizationInputSchema = z.object({
    organizationId: OrganizationSchema.shape.id,
    principalExternalId: UserSchema.shape.externalId // Principal user ID for ownership validation
});

/**
 * Input DTO for UpdateOrganization use case
 */
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationInputSchema>;

export const UpdateOrganizationOutputSchema = OrganizationSchema;

/**
 * Output DTO for UpdateOrganization use case
 * Reuses Organization from domain contracts to eliminate duplication
 */
export type UpdateOrganizationOutput = z.infer<typeof UpdateOrganizationOutputSchema>;
