import z from 'zod';
import { OrganizationSchema } from '../../entities';
import { UserSchema } from '../../../users';

/**
 * Input for TransferOrganizationOwnership use case
 */
export const TransferOrganizationOwnershipInputSchema = z.object({
    organizationId: OrganizationSchema.shape.id,
    newOwnerId: UserSchema.shape.id
});

export type TransferOrganizationOwnershipInput = z.infer<typeof TransferOrganizationOwnershipInputSchema>;

/**
 * Output for TransferOrganizationOwnership use case
 * Returns the updated organization with the new owner
 */
export const TransferOrganizationOwnershipOutputSchema = OrganizationSchema;

export type TransferOrganizationOwnershipOutput = z.infer<typeof TransferOrganizationOwnershipOutputSchema>;
