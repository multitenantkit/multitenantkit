import z from 'zod';
import { OrganizationSchema } from '../../entities';

/**
 * Input for RestoreOrganization use case
 */
export const RestoreOrganizationInputSchema = z.object({
    organizationId: OrganizationSchema.shape.id
});

export type RestoreOrganizationInput = z.infer<typeof RestoreOrganizationInputSchema>;
