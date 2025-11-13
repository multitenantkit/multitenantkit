import z from 'zod';
import { OrganizationSchema } from '../../entities';
import { UserSchema } from '../../../users/entities';

export const ArchiveOrganizationInputSchema = z.object({
    organizationId: OrganizationSchema.shape.id,
    principalExternalId: UserSchema.shape.externalId
});

/**
 * Input DTO for ArchiveOrganization use case
 * Archives an organization by setting archivedAt timestamp
 * Requires the principal's externalId to verify authorization (owner or admin)
 */
export type ArchiveOrganizationInput = z.infer<typeof ArchiveOrganizationInputSchema>;
