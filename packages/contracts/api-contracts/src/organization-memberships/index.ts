import { OrganizationMembershipSchema, OrganizationRole } from '@multitenantkit/domain-contracts';
import { z } from 'zod';

// Add Organization Member
export const AddOrganizationMemberRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid()
    }),
    body: z.object({
        username: z.string(),
        roleCode: OrganizationRole
    })
});

export const AddOrganizationMemberResponseSchema = OrganizationMembershipSchema;

// Accept Organization Invitation
export const AcceptOrganizationInvitationRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid()
    }),
    body: z.object({
        username: z.string()
    })
});

export const AcceptOrganizationInvitationResponseSchema = OrganizationMembershipSchema;

// Remove Organization Member
export const RemoveOrganizationMemberRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        userId: z.string() // User ID could be a username or a user ID
    }),
    query: z
        .object({
            /** If true, the user will be removed from the organization by username */
            username: z.string().optional()
        })
        .optional()
});

export const RemoveOrganizationMemberResponseSchema = z.object({
    requestId: z.string()
});

// Update Organization Member Role
export const UpdateOrganizationMemberRoleRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        userId: z.string().uuid()
    }),
    body: z.object({
        roleCode: OrganizationRole
    })
});

export const UpdateOrganizationMemberRoleResponseSchema = OrganizationMembershipSchema;

// Leave Organization
export const LeaveOrganizationRequestSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid()
    })
});

export const LeaveOrganizationResponseSchema = OrganizationMembershipSchema;

// List Organization Memberships (with pagination)
export const ListOrganizationMembershipsParamsSchema = z.object({
    organizationId: z.string().uuid()
});

// Type exports
export type AddOrganizationMemberRequest = z.infer<typeof AddOrganizationMemberRequestSchema>;
export type AddOrganizationMemberResponse = z.infer<typeof AddOrganizationMemberResponseSchema>;
export type AcceptOrganizationInvitationRequest = z.infer<
    typeof AcceptOrganizationInvitationRequestSchema
>;
export type AcceptOrganizationInvitationResponse = z.infer<
    typeof AcceptOrganizationInvitationResponseSchema
>;
export type RemoveOrganizationMemberRequest = z.infer<typeof RemoveOrganizationMemberRequestSchema>;
export type RemoveOrganizationMemberResponse = z.infer<
    typeof RemoveOrganizationMemberResponseSchema
>;
export type UpdateOrganizationMemberRoleRequest = z.infer<
    typeof UpdateOrganizationMemberRoleRequestSchema
>;
export type UpdateOrganizationMemberRoleResponse = z.infer<
    typeof UpdateOrganizationMemberRoleResponseSchema
>;
export type LeaveOrganizationRequest = z.infer<typeof LeaveOrganizationRequestSchema>;
export type LeaveOrganizationResponse = z.infer<typeof LeaveOrganizationResponseSchema>;
export type ListOrganizationMembershipsParams = z.infer<
    typeof ListOrganizationMembershipsParamsSchema
>;
