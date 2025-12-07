/**
 * Supabase Organization Membership Repository
 */

import type {
    FindMembersOptions,
    OrganizationMembership,
    OrganizationMembershipRepository,
    OrganizationMemberWithUserInfo,
    PaginatedResult,
    ToolkitOptions
} from '@multitenantkit/domain-contracts';
import { OrganizationMembershipRepositoryConfigHelper } from '@multitenantkit/domain-contracts';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    type OrganizationMembershipDbRow,
    OrganizationMembershipMapper
} from '../mappers/OrganizationMembershipMapper';

/**
 * Supabase implementation of OrganizationMembershipRepository
 */
export class SupabaseOrganizationMembershipRepository<
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default for optional custom fields
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default for optional custom fields
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default for optional custom fields
    TOrganizationMembershipCustomFields = {}
> implements
        OrganizationMembershipRepository<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
{
    private readonly configHelper: OrganizationMembershipRepositoryConfigHelper<TOrganizationMembershipCustomFields>;
    private readonly schemaName?: string;
    private readonly tableName: string;
    private readonly usersTableName: string;
    private readonly organizationsTableName: string;

    constructor(
        private readonly client: SupabaseClient,
        toolkitOptions?: ToolkitOptions<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) {
        const membershipConfig = toolkitOptions?.organizationMemberships?.customFields;
        this.schemaName = toolkitOptions?.organizationMemberships?.database?.schema;
        this.tableName =
            toolkitOptions?.organizationMemberships?.database?.table || 'organization_memberships';

        this.usersTableName = toolkitOptions?.users?.database?.table || 'users';
        this.organizationsTableName =
            toolkitOptions?.organizations?.database?.table || 'organizations';

        const databaseNamingStrategy =
            toolkitOptions?.organizationMemberships?.database?.namingStrategy;
        const globalNamingStrategy = toolkitOptions?.namingStrategy;

        this.configHelper = new OrganizationMembershipRepositoryConfigHelper(
            membershipConfig,
            databaseNamingStrategy,
            globalNamingStrategy
        );
    }

    private getTable() {
        if (this.schemaName) {
            return this.client.schema(this.schemaName).from(this.tableName);
        }
        return this.client.from(this.tableName);
    }

    private getSelectColumns(): string {
        if (this.configHelper.hasCustomFields) {
            return '*';
        }
        return [
            this.configHelper.getColumnName('id'),
            this.configHelper.getColumnName('userId'),
            this.configHelper.getColumnName('username'),
            this.configHelper.getColumnName('organizationId'),
            this.configHelper.getColumnName('roleCode'),
            this.configHelper.getColumnName('invitedAt'),
            this.configHelper.getColumnName('joinedAt'),
            this.configHelper.getColumnName('leftAt'),
            this.configHelper.getColumnName('deletedAt'),
            this.configHelper.getColumnName('createdAt'),
            this.configHelper.getColumnName('updatedAt')
        ].join(', ');
    }

    private mapToDomain(
        row: OrganizationMembershipDbRow
    ): OrganizationMembership & TOrganizationMembershipCustomFields {
        return OrganizationMembershipMapper.toDomainWithCustom<TOrganizationMembershipCustomFields>(
            row,
            this.configHelper.columnMap,
            this.configHelper.hasCustomFields
                ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                : undefined
        );
    }

    async findById(
        id: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .eq(this.configHelper.getColumnName('id'), id)
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return this.mapToDomain(data as unknown as OrganizationMembershipDbRow);
    }

    async findByUserIdAndOrganizationId(
        userId: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .eq(this.configHelper.getColumnName('userId'), userId)
            .eq(this.configHelper.getColumnName('organizationId'), organizationId)
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return this.mapToDomain(data as unknown as OrganizationMembershipDbRow);
    }

    async findByUsernameAndOrganizationId(
        username: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .ilike(this.configHelper.getColumnName('username'), username)
            .eq(this.configHelper.getColumnName('organizationId'), organizationId)
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return this.mapToDomain(data as unknown as OrganizationMembershipDbRow);
    }

    async findByOrganization(
        organizationId: string,
        activeOnly = false
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        let query = this.getTable()
            .select(this.getSelectColumns())
            .eq(this.configHelper.getColumnName('organizationId'), organizationId);

        if (activeOnly) {
            query = query
                .not(this.configHelper.getColumnName('joinedAt'), 'is', null)
                .is(this.configHelper.getColumnName('leftAt'), null)
                .is(this.configHelper.getColumnName('deletedAt'), null);
        }

        const { data, error } = await query;

        if (error || !data) {
            return [];
        }

        return (data as unknown as OrganizationMembershipDbRow[]).map((row) =>
            this.mapToDomain(row)
        );
    }

    async findByOrganizationWithUserInfo(
        organizationId: string,
        activeOnly = false
    ): Promise<
        OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[]
    > {
        // For now, return memberships without full user/org info
        // A more complete implementation would join with users and organizations tables
        const memberships = await this.findByOrganization(organizationId, activeOnly);

        // Return memberships with spread operator to match OrganizationMemberWithUserInfo type
        // Note: user and organization would need joins for full implementation
        return memberships.map((m) => ({
            ...m,
            membership: m,
            user: null as any,
            organization: null as any
        })) as unknown as OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[];
    }

    async findByOrganizationWithUserInfoPaginated(
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
    > {
        // Build select with joins to users and organizations tables
        // Supabase uses PostgREST syntax for joins via foreign key relationships
        // Format: related_table!foreign_key(columns)
        // Note: This requires foreign key relationships to be set up in Supabase
        const selectWithJoins = `
            *,
            user:${this.usersTableName}!${this.configHelper.getColumnName('userId')}(*),
            organization:${this.organizationsTableName}!${this.configHelper.getColumnName('organizationId')}(*)
        `;

        let query = this.getTable()
            .select(selectWithJoins, { count: 'exact' })
            .eq(this.configHelper.getColumnName('organizationId'), organizationId);

        // Build filter conditions based on options
        if (options?.includeActive) {
            query = query
                .not(this.configHelper.getColumnName('joinedAt'), 'is', null)
                .is(this.configHelper.getColumnName('leftAt'), null)
                .is(this.configHelper.getColumnName('deletedAt'), null);
        } else if (options?.includePending) {
            query = query
                .not(this.configHelper.getColumnName('invitedAt'), 'is', null)
                .is(this.configHelper.getColumnName('joinedAt'), null)
                .is(this.configHelper.getColumnName('leftAt'), null)
                .is(this.configHelper.getColumnName('deletedAt'), null);
        } else {
            // Default to active only
            query = query
                .not(this.configHelper.getColumnName('joinedAt'), 'is', null)
                .is(this.configHelper.getColumnName('leftAt'), null)
                .is(this.configHelper.getColumnName('deletedAt'), null);
        }

        // Apply pagination using page and pageSize
        const page = options?.page ?? 1;
        const pageSize = options?.pageSize ?? 10;
        const offset = (page - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);

        const { data, error, count } = await query;

        if (error || !data) {
            console.error('[SupabaseOrganizationMembershipRepository] Query error:', error);
            const total = 0;
            return { items: [], total, page, pageSize, totalPages: 0 };
        }

        const total = count ?? 0;
        const totalPages = Math.ceil(total / pageSize);

        // Transform data to OrganizationMemberWithUserInfo format
        // The joined data comes as nested objects: { ...membership, user: {...}, organization: {...} }
        const items = data.map((row: any) => {
            // Extract and map membership fields
            const membershipFields = this.mapToDomain(row as OrganizationMembershipDbRow);

            // Extract joined user (may be null if no user found)
            const userRow = row.user;
            const user = userRow
                ? {
                      id: userRow.id,
                      externalId: userRow.external_id,
                      username: userRow.username,
                      createdAt: new Date(userRow.created_at),
                      updatedAt: new Date(userRow.updated_at),
                      deletedAt: userRow.deleted_at ? new Date(userRow.deleted_at) : undefined,
                      // Include custom user fields (everything else in the row)
                      ...this.extractCustomFields(userRow, [
                          'id',
                          'external_id',
                          'username',
                          'created_at',
                          'updated_at',
                          'deleted_at'
                      ])
                  }
                : null;

            // Extract joined organization
            // Base fields from OrganizationSchema: id, ownerUserId, createdAt, updatedAt, archivedAt, deletedAt
            const orgRow = row.organization;
            const organization = orgRow
                ? {
                      id: orgRow.id,
                      ownerUserId: orgRow.owner_user_id,
                      createdAt: new Date(orgRow.created_at),
                      updatedAt: new Date(orgRow.updated_at),
                      archivedAt: orgRow.archived_at ? new Date(orgRow.archived_at) : undefined,
                      deletedAt: orgRow.deleted_at ? new Date(orgRow.deleted_at) : undefined,
                      // Include custom organization fields (everything not in base fields)
                      ...this.extractCustomFields(orgRow, [
                          'id',
                          'owner_user_id',
                          'created_at',
                          'updated_at',
                          'archived_at',
                          'deleted_at'
                      ])
                  }
                : null;

            return {
                ...membershipFields,
                user,
                organization
            };
        }) as OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[];

        return {
            items,
            total,
            page,
            pageSize,
            totalPages
        };
    }

    /**
     * Extract custom fields from a database row by excluding known base fields
     */
    private extractCustomFields(
        row: Record<string, any>,
        baseFieldNames: string[]
    ): Record<string, any> {
        const result: Record<string, any> = {};
        for (const key of Object.keys(row)) {
            if (!baseFieldNames.includes(key)) {
                // Transform snake_case to camelCase for domain
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                result[camelKey] = row[key];
            }
        }
        return result;
    }

    async findByUser(
        userId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .eq(this.configHelper.getColumnName('userId'), userId);

        if (error || !data) {
            return [];
        }

        return (data as unknown as OrganizationMembershipDbRow[]).map((row) =>
            this.mapToDomain(row)
        );
    }

    async findAll(): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        const { data, error } = await this.getTable().select(this.getSelectColumns());

        if (error || !data) {
            return [];
        }

        return (data as unknown as OrganizationMembershipDbRow[]).map((row) =>
            this.mapToDomain(row)
        );
    }

    async insert(
        membership: OrganizationMembership & TOrganizationMembershipCustomFields,
        _context?: OperationContext
    ): Promise<void> {
        const columns: Record<string, unknown> = {
            [this.configHelper.getColumnName('id')]: membership.id,
            [this.configHelper.getColumnName('userId')]: membership.userId,
            [this.configHelper.getColumnName('username')]: membership.username,
            [this.configHelper.getColumnName('organizationId')]: membership.organizationId,
            [this.configHelper.getColumnName('roleCode')]: membership.roleCode,
            [this.configHelper.getColumnName('invitedAt')]:
                membership.invitedAt?.toISOString() ?? null,
            [this.configHelper.getColumnName('joinedAt')]:
                membership.joinedAt?.toISOString() ?? null,
            [this.configHelper.getColumnName('leftAt')]: membership.leftAt?.toISOString() ?? null,
            [this.configHelper.getColumnName('deletedAt')]:
                membership.deletedAt?.toISOString() ?? null,
            [this.configHelper.getColumnName('createdAt')]: membership.createdAt.toISOString(),
            [this.configHelper.getColumnName('updatedAt')]: membership.updatedAt.toISOString()
        };

        const customFields = this.configHelper.customFieldsToDb(membership);
        Object.assign(columns, customFields);

        const { error } = await this.getTable().insert(columns);

        if (error) {
            throw new Error(`Failed to insert membership: ${error.message}`);
        }
    }

    async update(
        membership: OrganizationMembership & TOrganizationMembershipCustomFields,
        _context?: OperationContext
    ): Promise<void> {
        const columns: Record<string, unknown> = {
            [this.configHelper.getColumnName('roleCode')]: membership.roleCode,
            [this.configHelper.getColumnName('invitedAt')]:
                membership.invitedAt?.toISOString() ?? null,
            [this.configHelper.getColumnName('joinedAt')]:
                membership.joinedAt?.toISOString() ?? null,
            [this.configHelper.getColumnName('leftAt')]: membership.leftAt?.toISOString() ?? null,
            [this.configHelper.getColumnName('deletedAt')]:
                membership.deletedAt?.toISOString() ?? null,
            [this.configHelper.getColumnName('updatedAt')]: membership.updatedAt.toISOString()
        };

        const rawCustom = this.configHelper.customFieldsToDb(membership);
        const cleanCustom = Object.fromEntries(
            Object.entries(rawCustom || {}).filter(([, v]) => v !== undefined)
        );
        Object.assign(columns, cleanCustom);

        const updateData = Object.fromEntries(
            Object.entries(columns).filter(([, v]) => v !== undefined)
        );

        const { error } = await this.getTable()
            .update(updateData)
            .eq(this.configHelper.getColumnName('id'), membership.id);

        if (error) {
            throw new Error(`Failed to update membership: ${error.message}`);
        }
    }

    async delete(id: string, _context?: OperationContext): Promise<void> {
        const { error } = await this.getTable()
            .delete()
            .eq(this.configHelper.getColumnName('id'), id);

        if (error) {
            throw new Error(`Failed to delete membership: ${error.message}`);
        }
    }
}
