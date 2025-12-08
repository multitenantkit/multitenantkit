/**
 * User Mapper for Supabase
 *
 * Maps between database rows and domain User entities.
 * Handles column name mapping and custom fields transformation.
 */

import type { User } from '@multitenantkit/domain-contracts';

/**
 * Database row type for users
 */
export interface UserDbRow {
    id: string;
    external_id?: string;
    email?: string;
    username?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    [key: string]: unknown;
}

/**
 * Column mapping configuration
 */
export interface ColumnMap {
    id: string;
    externalId: string;
    username: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
}

/**
 * Default column mapping (snake_case)
 */
export const DEFAULT_COLUMN_MAP: ColumnMap = {
    id: 'id',
    externalId: 'external_id',
    username: 'username',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
};

/**
 * User mapper utilities
 */
export class UserMapper {
    /**
     * Map database row to domain User entity
     */
    static toDomain(row: UserDbRow, columnMap: ColumnMap = DEFAULT_COLUMN_MAP): User {
        return {
            id: row[columnMap.id] as string,
            externalId: row[columnMap.externalId] as string,
            username: row[columnMap.username] as string,
            createdAt: new Date(row[columnMap.createdAt] as string),
            updatedAt: new Date(row[columnMap.updatedAt] as string),
            deletedAt: row[columnMap.deletedAt]
                ? new Date(row[columnMap.deletedAt] as string)
                : undefined
        };
    }

    /**
     * Map database row to domain User entity with custom fields
     */
    static toDomainWithCustom<TCustomFields>(
        row: UserDbRow,
        columnMap: ColumnMap = DEFAULT_COLUMN_MAP,
        customFieldsMapper?: (row: UserDbRow) => TCustomFields
    ): User & TCustomFields {
        const baseUser = this.toDomain(row, columnMap);

        if (customFieldsMapper) {
            const customFields = customFieldsMapper(row);
            return { ...baseUser, ...customFields } as User & TCustomFields;
        }

        return baseUser as User & TCustomFields;
    }

    /**
     * Map domain User entity to database row
     */
    static toDb(user: User, columnMap: ColumnMap = DEFAULT_COLUMN_MAP): Record<string, unknown> {
        return {
            [columnMap.id]: user.id,
            [columnMap.externalId]: user.externalId,
            [columnMap.username]: user.username,
            [columnMap.createdAt]: user.createdAt.toISOString(),
            [columnMap.updatedAt]: user.updatedAt.toISOString(),
            [columnMap.deletedAt]: user.deletedAt?.toISOString() ?? null
        };
    }
}
