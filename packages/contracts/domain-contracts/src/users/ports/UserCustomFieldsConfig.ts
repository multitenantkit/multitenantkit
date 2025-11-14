import type { z } from 'zod';
import type { User } from '../entities';

/**
 * Configuration for UserRepository implementations
 * Allows users to customize column/field names and add custom fields
 *
 * This configuration is transversal across all repository implementations
 * (PostgreSQL, JSON, MongoDB, etc.)
 */
// biome-ignore lint/complexity/noBannedTypes: ignore
export interface UserCustomFieldsConfig<TCustomFields = {}> {
    /**
     * Column/field mapping for BASE framework fields
     * Maps framework field names to storage field names
     *
     * Use this to customize how the framework's built-in fields are stored.
     *
     * Examples:
     * - PostgreSQL: 'id' → 'user_id' (column name)
     * - JSON: 'id' → 'userId' (JSON key)
     * - MongoDB: 'id' → '_id' (document field)
     *
     * If not provided, uses default field names
     */
    columnMapping?: {
        id?: string;
        externalId?: string;
        username?: string;
        createdAt?: string;
        updatedAt?: string;
        deletedAt?: string;
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
     * - Calculated fields (e.g., fullName from firstName + lastName)
     * - JSON serialization (e.g., array → JSON string)
     * - Special renaming that doesn't follow namingStrategy
     *
     * Precedence: customMapper > namingStrategy
     * (customMapper can override namingStrategy transformations)
     *
     * Examples:
     * - Domain: { companyName: string } → Storage: { company_name: string }
     * - Domain: { address: string } → Storage: { user_address: string }
     */
    customMapper?: {
        /**
         * Convert custom domain fields to storage format
         *
         * Example:
         * toDb: (fields) => ({ company_name: fields.companyName })
         */
        toDb: (fields: Partial<User & TCustomFields>) => Record<string, any>;

        /**
         * Convert storage format to custom domain fields
         *
         * Example:
         * toDomain: (row) => ({ companyName: row.company_name })
         */
        toDomain: (dbRow: Record<string, any>) => TCustomFields;
    };
}

/**
 * Base framework field names for User entity
 * These are the field names in the domain model (camelCase)
 * that will be transformed according to namingStrategy or overridden by columnMapping
 */
export const USER_BASE_FIELDS = [
    'id',
    'externalId',
    'username',
    'createdAt',
    'updatedAt',
    'deletedAt'
] as const;

export type UserBaseField = (typeof USER_BASE_FIELDS)[number];
