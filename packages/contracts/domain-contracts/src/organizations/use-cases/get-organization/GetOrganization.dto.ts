import z from 'zod';
import { OrganizationSchema } from '../../entities';
import { UserSchema } from '../../../users/entities';

export const GetOrganizationInputSchema = z.object({
    organizationId: OrganizationSchema.shape.id,
    principalExternalId: UserSchema.shape.externalId // Principal user ID for ownership validation
});

/**
 * Input DTO for GetOrganization use case
 */
export type GetOrganizationInput = z.infer<typeof GetOrganizationInputSchema>;

export const GetOrganizationOutputSchema = OrganizationSchema;

/**
 * Output DTO for GetOrganization use case
 * Reuses Organization from domain contracts to eliminate duplication
 */
export type GetOrganizationOutput = z.infer<typeof GetOrganizationOutputSchema>;
