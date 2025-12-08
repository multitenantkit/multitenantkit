/**
 * Supabase Organization Repository
 */

import type {
    Organization,
    OrganizationRepository,
    ToolkitOptions
} from '@multitenantkit/domain-contracts';
import { OrganizationRepositoryConfigHelper } from '@multitenantkit/domain-contracts';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type OrganizationDbRow, OrganizationMapper } from '../mappers/OrganizationMapper';

/**
 * Supabase implementation of OrganizationRepository
 */
// biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
export class SupabaseOrganizationRepository<TCustomFields = {}> implements OrganizationRepository {
    private readonly configHelper: OrganizationRepositoryConfigHelper<TCustomFields>;
    private readonly schemaName?: string;
    private readonly tableName: string;

    constructor(
        private readonly client: SupabaseClient,
        toolkitOptions?: ToolkitOptions<unknown, TCustomFields, unknown>
    ) {
        const orgConfig = toolkitOptions?.organizations?.customFields;
        this.schemaName = toolkitOptions?.organizations?.database?.schema;
        this.tableName = toolkitOptions?.organizations?.database?.table || 'organizations';

        const databaseNamingStrategy = toolkitOptions?.organizations?.database?.namingStrategy;
        const globalNamingStrategy = toolkitOptions?.namingStrategy;

        this.configHelper = new OrganizationRepositoryConfigHelper(
            orgConfig,
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
            this.configHelper.getColumnName('ownerUserId'),
            this.configHelper.getColumnName('createdAt'),
            this.configHelper.getColumnName('updatedAt'),
            this.configHelper.getColumnName('deletedAt')
        ].join(', ');
    }

    private mapToDomain(row: OrganizationDbRow): Organization & TCustomFields {
        return OrganizationMapper.toDomainWithCustom<TCustomFields>(
            row,
            this.configHelper.columnMap,
            this.configHelper.hasCustomFields
                ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                : undefined
        );
    }

    async findById(id: string): Promise<(Organization & TCustomFields) | null> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .eq(this.configHelper.getColumnName('id'), id)
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return this.mapToDomain(data as unknown as OrganizationDbRow);
    }

    async findByOwner(ownerUserId: string): Promise<(Organization & TCustomFields)[]> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .eq(this.configHelper.getColumnName('ownerUserId'), ownerUserId);

        if (error || !data) {
            return [];
        }

        return (data as unknown as OrganizationDbRow[]).map((row) => this.mapToDomain(row));
    }

    async findByIds(ids: string[]): Promise<(Organization & TCustomFields)[]> {
        if (ids.length === 0) {
            return [];
        }

        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .in(this.configHelper.getColumnName('id'), ids);

        if (error || !data) {
            return [];
        }

        return (data as unknown as OrganizationDbRow[]).map((row) => this.mapToDomain(row));
    }

    async count(): Promise<number> {
        const { count, error } = await this.getTable().select('*', { count: 'exact', head: true });

        if (error) {
            throw new Error(`Failed to count organizations: ${error.message}`);
        }

        return count ?? 0;
    }

    async findMany(options?: {
        limit?: number;
        offset?: number;
        status?: 'active' | 'archived';
        ownerUserId?: string;
    }): Promise<(Organization & TCustomFields)[]> {
        let query = this.getTable().select(this.getSelectColumns());

        if (options?.ownerUserId) {
            query = query.eq(this.configHelper.getColumnName('ownerUserId'), options.ownerUserId);
        }

        if (options?.status === 'active') {
            query = query.is(this.configHelper.getColumnName('deletedAt'), null);
        } else if (options?.status === 'archived') {
            query = query.not(this.configHelper.getColumnName('deletedAt'), 'is', null);
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options?.limit ?? 10) - 1);
        }

        const { data, error } = await query;

        if (error || !data) {
            return [];
        }

        return (data as unknown as OrganizationDbRow[]).map((row) => this.mapToDomain(row));
    }

    async insert(org: Organization & TCustomFields, _context?: OperationContext): Promise<void> {
        const columns: Record<string, unknown> = {
            [this.configHelper.getColumnName('id')]: org.id,
            [this.configHelper.getColumnName('ownerUserId')]: org.ownerUserId,
            [this.configHelper.getColumnName('createdAt')]: org.createdAt.toISOString(),
            [this.configHelper.getColumnName('updatedAt')]: org.updatedAt.toISOString(),
            [this.configHelper.getColumnName('deletedAt')]: org.deletedAt?.toISOString() ?? null
        };

        const customFields = this.configHelper.customFieldsToDb(org);
        Object.assign(columns, customFields);

        const { error } = await this.getTable().insert(columns);

        if (error) {
            throw new Error(`Failed to insert organization: ${error.message}`);
        }
    }

    async update(org: Organization & TCustomFields, _context?: OperationContext): Promise<void> {
        const columns: Record<string, unknown> = {
            [this.configHelper.getColumnName('ownerUserId')]: org.ownerUserId,
            [this.configHelper.getColumnName('updatedAt')]: org.updatedAt.toISOString(),
            [this.configHelper.getColumnName('deletedAt')]: org.deletedAt?.toISOString() ?? null
        };

        const rawCustom = this.configHelper.customFieldsToDb(org);
        const cleanCustom = Object.fromEntries(
            Object.entries(rawCustom || {}).filter(([, v]) => v !== undefined)
        );
        Object.assign(columns, cleanCustom);

        const updateData = Object.fromEntries(
            Object.entries(columns).filter(([, v]) => v !== undefined)
        );

        const { error } = await this.getTable()
            .update(updateData)
            .eq(this.configHelper.getColumnName('id'), org.id);

        if (error) {
            throw new Error(`Failed to update organization: ${error.message}`);
        }
    }

    async delete(id: string, _context?: OperationContext): Promise<void> {
        const { error } = await this.getTable()
            .delete()
            .eq(this.configHelper.getColumnName('id'), id);

        if (error) {
            throw new Error(`Failed to delete organization: ${error.message}`);
        }
    }
}
