import z from 'zod';
import { OrganizationMembershipSchema } from '../../../organization-memberships/entities';
import { UserSchema } from '../../../users/entities';
import { OrganizationSchema } from '../../entities';
import { PaginationMetadataSchema } from '../../../shared/results';

export const ListOrganizationMembersInputSchema = z.object({
    principalExternalId: UserSchema.shape.externalId,
    organizationId: z.string().uuid(),
    /** Filter and pagination options */
    options: z.object({
        /** Include active members (joinedAt NOT NULL, leftAt NULL, deletedAt NULL) */
        includeActive: z.boolean().optional(),
        /** Include pending invitations (invitedAt NOT NULL, joinedAt NULL, leftAt NULL, deletedAt NULL) */
        includePending: z.boolean().optional(),
        /** Include removed members (leftAt NOT NULL OR deletedAt NOT NULL) */
        includeRemoved: z.boolean().optional(),
        /** Page number (1-indexed), defaults to 1 */
        page: z.number().int().min(1).default(1),
        /** Number of items per page, defaults to 20 */
        pageSize: z.number().int().min(1).max(100).default(20)
    }).default({ page: 1, pageSize: 20 })
});

// Extended membership schema that includes user and organization information
// This matches the OrganizationMemberWithUserInfo type structure (flat with nested user and organization)
// User can be null for pending invitations without registered users
export const OrganizationMemberWithUserSchema = OrganizationMembershipSchema.extend({
    user: UserSchema.nullable(),
    organization: OrganizationSchema
});

// Paginated output schema using shared PaginationMetadataSchema
export const ListOrganizationMembersOutputSchema = z.object({
    items: z.array(OrganizationMemberWithUserSchema),
    pagination: PaginationMetadataSchema
});

export type ListOrganizationMembersInput = z.infer<typeof ListOrganizationMembersInputSchema>;
export type ListOrganizationMembersOutput = z.infer<typeof ListOrganizationMembersOutputSchema>;
export type OrganizationMemberWithUser = z.infer<typeof OrganizationMemberWithUserSchema>;
