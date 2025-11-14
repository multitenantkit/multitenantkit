import type { z } from 'zod';

/**
 * Configuration for OrganizationMembershipRepository implementations
 * Allows users to customize column/field names and add custom fields
 *
 * This configuration is transversal across all repository implementations
 * (PostgreSQL, JSON, MongoDB, etc.)
 */

// biome-ignore lint/complexity/noBannedTypes: ignore
export interface OrganizationMembershipCustomFieldsConfig<TCustomFields = {}> {
    /**
     * Column/field mapping for BASE framework fields
     * Maps framework field names to storage field names
     *
     * Use this to customize how the framework's built-in fields are stored.
     *
     * Examples:
     * - PostgreSQL: 'id' → 'membership_id' (column name)
     * - JSON: 'id' → 'membershipId' (JSON key)
     * - MongoDB: 'id' → '_id' (document field)
     *
     * If not provided, uses default field names
     */
    columnMapping?: {
        id?: string; // default: 'id'
        userId?: string; // default: 'user_id'
        organizationId?: string; // default: 'organization_id'
        roleCode?: string; // default: 'role_code'
        invitedAt?: string; // default: 'invited_at'
        joinedAt?: string; // default: 'joined_at'
        leftAt?: string; // default: 'left_at'
        createdAt?: string; // default: 'created_at'
        updatedAt?: string; // default: 'updated_at'
        deletedAt?: string; // default: 'deleted_at'
    };

    /**
     * Schema for custom fields (optional, for runtime validation)
     * Can be used by any repository implementation that supports validation
     */
    customSchema?: z.ZodSchema<TCustomFields>;

    /**
     * Mapper for CUSTOM fields with complex logic
     * Converts between domain representation and storage representation
     *
     * Use this for:
     * - Calculated fields
     * - JSON serialization (e.g., array → JSON string)
     * - Special renaming that doesn't follow namingStrategy
     *
     * Precedence: customMapper > namingStrategy
     * (customMapper can override namingStrategy transformations)
     *
     * Examples:
     * - Domain: { notes: string } → Storage: { membership_notes: string }
     * - Domain: { permissions: string[] } → Storage: { custom_permissions: string[] }
     */
    customMapper?: {
        /**
         * Convert custom domain fields to storage format
         *
         * Example:
         * toDb: (fields) => ({ membership_notes: fields.notes })
         */
        toDb: (fields: TCustomFields) => Record<string, any>;

        /**
         * Convert storage format to custom domain fields
         *
         * Example:
         * toDomain: (row) => ({ notes: row.membership_notes })
         */
        toDomain: (dbRow: Record<string, any>) => TCustomFields;
    };
}

/**
 * Base framework field names for OrganizationMembership entity
 * These are the field names in the domain model (camelCase)
 * that will be transformed according to namingStrategy or overridden by columnMapping
 */
export const ORGANIZATION_MEMBERSHIP_BASE_FIELDS = [
    'id',
    'userId',
    'username',
    'organizationId',
    'roleCode',
    'invitedAt',
    'joinedAt',
    'leftAt',
    'createdAt',
    'updatedAt',
    'deletedAt'
] as const;

export type OrganizationMembershipBaseField = (typeof ORGANIZATION_MEMBERSHIP_BASE_FIELDS)[number];
