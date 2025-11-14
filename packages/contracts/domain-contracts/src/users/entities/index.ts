import { z } from 'zod';
import { DateTime, Uuid } from '../../shared/primitives';

/**
 * User domain properties schema for serialization/validation
 */
export const UserSchema = z.object({
    id: Uuid,
    externalId: z.string(), // Auth provider user ID, this can be null if the user is invited but not registered
    username: z.string(), // Thi is how the user is identified by end users,
    // it could be an email, a nickname, a phone number, etc.
    createdAt: DateTime,
    updatedAt: DateTime,
    deletedAt: DateTime.nullish().transform((v) => v ?? undefined)
});

/**
 * Inferred TypeScript type from the schema (for serialization)
 */
export type User = z.infer<typeof UserSchema>;
