/**
 * Organization Mapper for Supabase
 */

import type { Organization } from '@multitenantkit/domain-contracts';

/**
 * Database row type for organizations
 */
export interface OrganizationDbRow {
    id: string;
    owner_user_id: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    [key: string]: unknown;
}

/**
 * Column mapping configuration
 */
export interface OrganizationColumnMap {
    id: string;
    ownerUserId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
}

/**
 * Default column mapping (snake_case)
 */
export const DEFAULT_ORGANIZATION_COLUMN_MAP: OrganizationColumnMap = {
    id: 'id',
    ownerUserId: 'owner_user_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
};

/**
 * Organization mapper utilities
 */
export class OrganizationMapper {
    /**
     * Map database row to domain Organization entity
     */
    static toDomain(
        row: OrganizationDbRow,
        columnMap: OrganizationColumnMap = DEFAULT_ORGANIZATION_COLUMN_MAP
    ): Organization {
        return {
            id: row[columnMap.id] as string,
            ownerUserId: row[columnMap.ownerUserId] as string,
            createdAt: new Date(row[columnMap.createdAt] as string),
            updatedAt: new Date(row[columnMap.updatedAt] as string),
            deletedAt: row[columnMap.deletedAt]
                ? new Date(row[columnMap.deletedAt] as string)
                : undefined
        };
    }

    /**
     * Map database row to domain Organization entity with custom fields
     */
    static toDomainWithCustom<TCustomFields>(
        row: OrganizationDbRow,
        columnMap: OrganizationColumnMap = DEFAULT_ORGANIZATION_COLUMN_MAP,
        customFieldsMapper?: (row: OrganizationDbRow) => TCustomFields
    ): Organization & TCustomFields {
        const baseOrg = OrganizationMapper.toDomain(row, columnMap);

        if (customFieldsMapper) {
            const customFields = customFieldsMapper(row);
            return { ...baseOrg, ...customFields } as Organization & TCustomFields;
        }

        return baseOrg as Organization & TCustomFields;
    }

    /**
     * Map domain Organization entity to database row
     */
    static toDb(
        org: Organization,
        columnMap: OrganizationColumnMap = DEFAULT_ORGANIZATION_COLUMN_MAP
    ): Record<string, unknown> {
        return {
            [columnMap.id]: org.id,
            [columnMap.ownerUserId]: org.ownerUserId,
            [columnMap.createdAt]: org.createdAt.toISOString(),
            [columnMap.updatedAt]: org.updatedAt.toISOString(),
            [columnMap.deletedAt]: org.deletedAt?.toISOString() ?? null
        };
    }
}
