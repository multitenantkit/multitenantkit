/**
 * Organization Membership Mapper for Supabase
 */

import type { OrganizationMembership } from '@multitenantkit/domain-contracts';

/**
 * Database row type for organization memberships
 */
export interface OrganizationMembershipDbRow {
    id: string;
    user_id: string;
    username: string;
    organization_id: string;
    role_code: string;
    invited_at?: string | null;
    joined_at?: string | null;
    left_at?: string | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

/**
 * Column mapping configuration
 */
export interface OrganizationMembershipColumnMap {
    id: string;
    userId: string;
    username: string;
    organizationId: string;
    roleCode: string;
    invitedAt: string;
    joinedAt: string;
    leftAt: string;
    deletedAt: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Default column mapping (snake_case)
 */
export const DEFAULT_MEMBERSHIP_COLUMN_MAP: OrganizationMembershipColumnMap = {
    id: 'id',
    userId: 'user_id',
    username: 'username',
    organizationId: 'organization_id',
    roleCode: 'role_code',
    invitedAt: 'invited_at',
    joinedAt: 'joined_at',
    leftAt: 'left_at',
    deletedAt: 'deleted_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
};

/**
 * Organization Membership mapper utilities
 */
export class OrganizationMembershipMapper {
    /**
     * Map database row to domain OrganizationMembership entity
     */
    static toDomain(
        row: OrganizationMembershipDbRow,
        columnMap: OrganizationMembershipColumnMap = DEFAULT_MEMBERSHIP_COLUMN_MAP
    ): OrganizationMembership {
        return {
            id: row[columnMap.id] as string,
            userId: row[columnMap.userId] as string,
            username: row[columnMap.username] as string,
            organizationId: row[columnMap.organizationId] as string,
            roleCode: row[columnMap.roleCode] as 'owner' | 'admin' | 'member',
            invitedAt: row[columnMap.invitedAt]
                ? new Date(row[columnMap.invitedAt] as string)
                : undefined,
            joinedAt: row[columnMap.joinedAt]
                ? new Date(row[columnMap.joinedAt] as string)
                : undefined,
            leftAt: row[columnMap.leftAt] ? new Date(row[columnMap.leftAt] as string) : undefined,
            deletedAt: row[columnMap.deletedAt]
                ? new Date(row[columnMap.deletedAt] as string)
                : undefined,
            createdAt: new Date(row[columnMap.createdAt] as string),
            updatedAt: new Date(row[columnMap.updatedAt] as string)
        };
    }

    /**
     * Map database row to domain entity with custom fields
     */
    static toDomainWithCustom<TCustomFields>(
        row: OrganizationMembershipDbRow,
        columnMap: OrganizationMembershipColumnMap = DEFAULT_MEMBERSHIP_COLUMN_MAP,
        customFieldsMapper?: (row: OrganizationMembershipDbRow) => TCustomFields
    ): OrganizationMembership & TCustomFields {
        const baseMembership = OrganizationMembershipMapper.toDomain(row, columnMap);

        if (customFieldsMapper) {
            const customFields = customFieldsMapper(row);
            return { ...baseMembership, ...customFields } as OrganizationMembership & TCustomFields;
        }

        return baseMembership as OrganizationMembership & TCustomFields;
    }

    /**
     * Map domain entity to database row
     */
    static toDb(
        membership: OrganizationMembership,
        columnMap: OrganizationMembershipColumnMap = DEFAULT_MEMBERSHIP_COLUMN_MAP
    ): Record<string, unknown> {
        return {
            [columnMap.id]: membership.id,
            [columnMap.userId]: membership.userId,
            [columnMap.username]: membership.username,
            [columnMap.organizationId]: membership.organizationId,
            [columnMap.roleCode]: membership.roleCode,
            [columnMap.invitedAt]: membership.invitedAt?.toISOString() ?? null,
            [columnMap.joinedAt]: membership.joinedAt?.toISOString() ?? null,
            [columnMap.leftAt]: membership.leftAt?.toISOString() ?? null,
            [columnMap.deletedAt]: membership.deletedAt?.toISOString() ?? null,
            [columnMap.createdAt]: membership.createdAt.toISOString(),
            [columnMap.updatedAt]: membership.updatedAt.toISOString()
        };
    }
}
