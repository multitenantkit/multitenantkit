import { z } from 'zod';
import { Uuid, DateTime } from '../../shared/primitives';

export const OrganizationSchema = z.object({
    id: Uuid,
    ownerUserId: Uuid,
    createdAt: DateTime,
    updatedAt: DateTime,
    archivedAt: DateTime.nullish().transform((v) => v ?? undefined),
    // a deleted organization is not recoverable
    deletedAt: DateTime.nullish().transform((v) => v ?? undefined)
});

/**
 * Inferred TypeScript types
 */
export type Organization = z.infer<typeof OrganizationSchema>;
