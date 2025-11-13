import z from 'zod';
import { UserSchema } from '../../entities';

export const DeleteUserInputSchema = z.object({
    principalExternalId: UserSchema.shape.id
});

/**
 * Input DTO for DeleteUser use case
 * Soft deletes a user by setting deletedAt timestamp
 */
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;
