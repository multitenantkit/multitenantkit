import z from 'zod';
import { UserSchema } from '../../entities';

export const UpdateUserInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId
});
// .refine((data) => data.email !== undefined, {
//     message: "At least one field must be provided for update",
// });

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
