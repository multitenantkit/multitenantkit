import { z } from 'zod';
import { Organization } from '../entities';

/**
 * Configuration for OrganizationRepository implementations
 * Allows users to customize column/field names and add custom fields
 *
 * This configuration is transversal across all repository implementations
 * (PostgreSQL, JSON, MongoDB, etc.)
 */
export interface OrganizationCustomFieldsConfig<TCustomFields = {}> {
    /**
     * Column/field mapping for BASE framework fields
     * Maps framework field names to storage field names
     *
     * Use this to customize how the framework's built-in fields are stored.
     *
     * Examples:
     * - PostgreSQL: 'id' → 'organization_id' (column name)
     * - JSON: 'id' → 'organizationId' (JSON key)
     * - MongoDB: 'id' → '_id' (document field)
     *
     * If not provided, uses default field names
     */
    columnMapping?: {
        id?: string; // default: 'id'
        ownerUserId?: string; // default: 'owner_user_id'
        createdAt?: string; // default: 'created_at'
        updatedAt?: string; // default: 'updated_at'
        archivedAt?: string; // default: 'archived_at'
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
     * - Calculated fields (e.g., annualPrice from monthlyPrice * 12)
     * - JSON serialization (e.g., array → JSON string)
     * - Special renaming that doesn't follow namingStrategy
     *
     * Precedence: customMapper > namingStrategy
     * (customMapper can override namingStrategy transformations)
     *
     * Examples:
     * - Domain: { organizationDescription: string } → Storage: { organization_description: string }
     * - Domain: { organizationId: string } → Storage: { org_id: string }
     */
    customMapper?: {
        /**
         * Convert custom domain fields to storage format
         *
         * Example:
         * toDb: (fields) => ({ organization_description: fields.organizationDescription })
         */
        toDb: (fields: Partial<Organization & TCustomFields>) => Record<string, any>;

        /**
         * Convert storage format to custom domain fields
         *
         * Example:
         * toDomain: (row) => ({ organizationDescription: row.organization_description })
         */
        toDomain: (dbRow: Record<string, any>) => TCustomFields;
    };
}

/**
 * Base framework field names for Organization entity
 * These are the field names in the domain model (camelCase)
 * that will be transformed according to namingStrategy or overridden by columnMapping
 */
export const ORGANIZATION_BASE_FIELDS = [
    'id',
    'ownerUserId',
    'createdAt',
    'updatedAt',
    'archivedAt',
    'deletedAt'
] as const;

export type OrganizationBaseField = (typeof ORGANIZATION_BASE_FIELDS)[number];
