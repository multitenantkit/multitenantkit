import z from 'zod';
import { UserSchema } from '../../entities';

export const GetUserInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId
});

/**
 * Input DTO for GetUser use case
 * Keeps specific interface as it includes userId for identification
 */
export type GetUserInput = z.infer<typeof GetUserInputSchema>;
