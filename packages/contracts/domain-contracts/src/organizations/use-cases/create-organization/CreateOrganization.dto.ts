import z from 'zod';
import { UserSchema } from '../../../users';
import { OrganizationSchema } from '../../entities';

export const CreateOrganizationInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId
});

/**
 * Input DTO for CreateOrganization use case
 */
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInputSchema>;

export const CreateOrganizationOutputSchema = OrganizationSchema;

/**
 * Output DTO for CreateOrganization use case
 * Reuses Organization from domain contracts to eliminate duplication
 */
export type CreateOrganizationOutput = z.infer<typeof CreateOrganizationOutputSchema>;
