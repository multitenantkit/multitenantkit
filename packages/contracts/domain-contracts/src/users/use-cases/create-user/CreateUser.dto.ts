import z from 'zod';
import { UserSchema } from '../../entities';

export const CreateUserInputSchema = z.object({
    id: UserSchema.shape.id.optional(),
    externalId: UserSchema.shape.externalId.optional(),
    username: UserSchema.shape.username // username is now required
});

/**
 * Input DTO for CreateUser use case
 */
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const CreateUserOutputSchema = UserSchema;

/**
 * Output DTO for CreateUser use case
 * Reuses User from domain contracts to eliminate duplication
 */
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;
