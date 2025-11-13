import { z } from 'zod';
import { OrganizationSchema } from '@multitenantkit/domain-contracts';

// Create Organization
export const CreateOrganizationRequestSchema = z.object({
    body: OrganizationSchema.pick({})
    // Custom fields are merged in the handler
});

// Get Organization
export const GetOrganizationRequestSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const UpdateOrganizationRequestSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: OrganizationSchema.pick({})
    // Custom fields are merged in the handler
});

// List Organization Members (with pagination)
export const ListOrganizationMembersRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid()
    }),
    query: z
        .object({
            /** Include active members (joinedAt NOT NULL, leftAt NULL, deletedAt NULL) */
            includeActive: z
                .string()
                .optional()
                .transform((val) => val === 'true'),
            /** Include pending invitations (invitedAt NOT NULL, joinedAt NULL, leftAt NULL, deletedAt NULL) */
            includePending: z
                .string()
                .optional()
                .transform((val) => val === 'true'),
            /** Include removed members (leftAt NOT NULL OR deletedAt NOT NULL) */
            includeRemoved: z
                .string()
                .optional()
                .transform((val) => val === 'true'),
            /** Page number (1-indexed) */
            page: z
                .string()
                .optional()
                .transform((val) => (val ? parseInt(val, 10) : 1)),
            /** Number of items per page (max 100) */
            pageSize: z
                .string()
                .optional()
                .transform((val) => {
                    const num = val ? parseInt(val, 10) : 20;
                    return Math.min(num, 100); // Cap at 100
                })
        })
        .optional()
});

// Delete Organization (principalExternalId comes from authenticated principal)
export const DeleteOrganizationRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid()
    })
});

// Archive Organization (principalExternalId comes from authenticated principal)
export const ArchiveOrganizationRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid()
    })
});

// Restore Organization
export const RestoreOrganizationRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid()
    })
});

// Transfer Organization Ownership
export const TransferOrganizationOwnershipRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid()
    }),
    body: z.object({
        newOwnerId: z.string().uuid()
    })
});

// Type exports
export type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequestSchema>;
export type GetOrganizationRequest = z.infer<typeof GetOrganizationRequestSchema>;
export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;
export type ListOrganizationMembersRequest = z.infer<typeof ListOrganizationMembersRequestSchema>;
export type DeleteOrganizationRequest = z.infer<typeof DeleteOrganizationRequestSchema>;
export type ArchiveOrganizationRequest = z.infer<typeof ArchiveOrganizationRequestSchema>;
export type RestoreOrganizationRequest = z.infer<typeof RestoreOrganizationRequestSchema>;
export type TransferOrganizationOwnershipRequest = z.infer<
    typeof TransferOrganizationOwnershipRequestSchema
>;
