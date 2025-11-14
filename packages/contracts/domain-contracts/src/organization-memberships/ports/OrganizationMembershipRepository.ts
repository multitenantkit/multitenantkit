import type { OperationContext, PaginatedResult, PaginationOptions } from '../../shared';
import type { OrganizationMembership, OrganizationMemberWithUserInfo } from '../entities';

/**
 * Options for finding organization members with pagination and filtering
 * Extends base pagination options with domain-specific filters
 *
 * Filter conditions can be combined:
 * - activeMembers: joinedAt NOT NULL, leftAt NULL, deletedAt NULL
 * - pendingInvitations: invitedAt NOT NULL, joinedAt NULL, leftAt NULL, deletedAt NULL
 * - removedMembers: leftAt NOT NULL OR deletedAt NOT NULL
 *
 * Examples:
 * - { includeActive: true } - Only active members
 * - { includeActive: true, includePending: true } - Active + pending invitations
 * - { includeActive: true, includePending: true, includeRemoved: true } - All members
 */
export interface FindMembersOptions extends PaginationOptions {
    /** Include active members (joinedAt NOT NULL, leftAt NULL, deletedAt NULL) */
    includeActive?: boolean;
    /** Include pending invitations (invitedAt NOT NULL, joinedAt NULL, leftAt NULL, deletedAt NULL) */
    includePending?: boolean;
    /** Include removed members (leftAt NOT NULL OR deletedAt NOT NULL) */
    includeRemoved?: boolean;
}

/**
 * Repository port for OrganizationMembership entity
 * Defines the contract that adapters must implement
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Additional fields beyond the base User
 * @template TOrganizationCustomFields - Additional fields beyond the base Organization
 * @template TOrganizationMembershipCustomFields - Additional fields beyond the base OrganizationMembership
 *                                         Default is empty object for backward compatibility
 */
export interface OrganizationMembershipRepository<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
> {
    /**
     * Insert a new organization membership
     * @param membership The membership entity to insert (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    insert(
        membership: OrganizationMembership & TOrganizationMembershipCustomFields,
        context?: OperationContext
    ): Promise<void>;

    /**
     * Update an existing organization membership
     * @param membership The membership entity to update (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    update(
        membership: OrganizationMembership & TOrganizationMembershipCustomFields,
        context?: OperationContext
    ): Promise<void>;

    /**
     * Find a organization membership by its ID
     */
    findById(
        id: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null>;

    /**
     * Find a organization membership by user and organization
     */
    findByUserIdAndOrganizationId(
        userId: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null>;

    /**
     * Find a organization membership by username and organization
     */
    findByUsernameAndOrganizationId(
        username: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null>;

    /**
     * Find all organization memberships for a specific organization
     */
    findByOrganization(
        organizationId: string,
        activeOnly?: boolean
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]>;

    /**
     * Find organization memberships with user and organization information (for display purposes)
     * Includes custom fields for membership, user, and organization
     * @deprecated Use findByOrganizationWithUserInfoPaginated instead
     */
    findByOrganizationWithUserInfo(
        organizationId: string,
        activeOnly?: boolean
    ): Promise<
        OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[]
    >;

    /**
     * Find organization memberships with user and organization information with pagination
     * Includes custom fields for membership, user, and organization
     * Returns paginated result with total count
     */
    findByOrganizationWithUserInfoPaginated(
        organizationId: string,
        options?: FindMembersOptions
    ): Promise<
        PaginatedResult<
            OrganizationMemberWithUserInfo<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        >
    >;

    /**
     * Find all organization memberships for a specific user
     */
    findByUser(
        userId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]>;

    /**
     * Delete a organization membership by ID
     * @param id The membership ID to delete
     * @param context Optional operation context for audit logging
     */
    delete(id: string, context?: OperationContext): Promise<void>;

    /**
     * Find all organization memberships (for admin purposes)
     */
    findAll(): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]>;
}
