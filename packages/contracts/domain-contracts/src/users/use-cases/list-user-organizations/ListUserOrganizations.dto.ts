import z from 'zod';
import { OrganizationSchema } from '../../../organizations/entities';
import { UserSchema } from '../../entities';

export const ListUserOrganizationsInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId
});

export const ListUserOrganizationsOutputSchema = z.array(OrganizationSchema);

export type ListUserOrganizationsInput = z.infer<typeof ListUserOrganizationsInputSchema>;
export type ListUserOrganizationsOutput = z.infer<typeof ListUserOrganizationsOutputSchema>;
