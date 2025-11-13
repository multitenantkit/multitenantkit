import z from 'zod';
import { OrganizationSchema } from '../../entities';
import { UserSchema } from '../../../users/entities';

export const DeleteOrganizationInputSchema = z.object({
    organizationId: OrganizationSchema.shape.id,
    principalExternalId: UserSchema.shape.externalId
});

/**
 * Input DTO for DeleteOrganization use case
 * Soft deletes a organization by setting deletedAt timestamp
 * Requires the principal's externalId to verify authorization (only owner can delete)
 */
export type DeleteOrganizationInput = z.infer<typeof DeleteOrganizationInputSchema>;

