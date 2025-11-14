import { z } from 'zod';
import type { Organization } from '../../organizations';
import { DateTime, Uuid } from '../../shared/primitives';
import { type User, UserSchema } from '../../users';

/**
 * Organization role enumeration
 */
export const OrganizationRole = z.enum(['owner', 'admin', 'member']);
// TODO: use an independent entity for roles, with its own repository

/**
 * OrganizationMembership domain properties schema - SOURCE OF TRUTH
 * Defines the canonical structure of the OrganizationMembership entity in the domain
 */
export const OrganizationMembershipSchema = z.object({
    id: Uuid,
    // if userId is null, it means that the user was invited but not registered
    userId: Uuid.nullish().transform((v) => v ?? undefined),
    username: UserSchema.shape.username,
    organizationId: Uuid,
    roleCode: OrganizationRole,
    invitedAt: DateTime.nullish().transform((v) => v ?? undefined),
    joinedAt: DateTime.nullish().transform((v) => v ?? undefined),
    leftAt: DateTime.nullish().transform((v) => v ?? undefined),
    deletedAt: DateTime.nullish().transform((v) => v ?? undefined),
    createdAt: DateTime,
    updatedAt: DateTime
});
// TODO: ideally a user may have multiple memberships in the same organization, but only one is active
// this way we can keep track of the user's interactions with the organization

/**
 * Organization member with complete user and organization information
 * Includes all membership fields at root level plus nested user and organization objects
 * Supports custom fields for all three entities
 *
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization
 * @template TOrganizationMembershipCustomFields - Custom fields added to OrganizationMembership
 */
export type OrganizationMemberWithUserInfo<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
> = OrganizationMembership &
    TOrganizationMembershipCustomFields & {
        /**
         * User information including base fields and custom fields
         */
        user: (User & TUserCustomFields) | null;

        /**
         * Organization information including base fields and custom fields
         */
        organization: Organization & TOrganizationCustomFields;
    };

/**
 * Inferred TypeScript types
 */
export type OrganizationMembership = z.infer<typeof OrganizationMembershipSchema>;
export type OrganizationRoleType = z.infer<typeof OrganizationRole>;
