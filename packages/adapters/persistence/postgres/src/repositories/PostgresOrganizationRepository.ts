import {
    type FrameworkConfig,
    type Organization,
    type OrganizationRepository,
    OrganizationRepositoryConfigHelper
} from '@multitenantkit/domain-contracts';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import type postgres from 'postgres';
import { OrganizationMapper } from '../mappers/OrganizationMapper';

/**
 * PostgreSQL implementation of OrganizationRepository
 * Handles all organization-related database operations using direct SQL queries
 *
 * Generic support for custom fields:
 * @template TCustomFields - Custom fields added to Organization
 *
 * Note: Custom fields are handled at the mapper level. This repository
 * returns Organization which may include custom fields from the database.
 */
// biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default for optional custom fields
export class PostgresOrganizationRepository<TCustomFields = {}>
    implements OrganizationRepository<TCustomFields>
{
    private readonly configHelper: OrganizationRepositoryConfigHelper<TCustomFields>;
    private readonly schemaName?: string;
    private readonly tableName: string;

    constructor(
        private readonly sql: postgres.Sql,
        frameworkConfig?: FrameworkConfig<any, TCustomFields, any>
    ) {
        // Extract organization custom fields config from framework config
        const organizationConfig = frameworkConfig?.organizations?.customFields;

        // Extract database configuration with defaults
        this.schemaName = frameworkConfig?.organizations?.database?.schema;
        this.tableName = frameworkConfig?.organizations?.database?.table || 'organizations';

        // Extract naming strategies
        const databaseNamingStrategy = frameworkConfig?.organizations?.database?.namingStrategy;
        const globalNamingStrategy = frameworkConfig?.namingStrategy;

        // Use helper to handle configuration logic
        this.configHelper = new OrganizationRepositoryConfigHelper(
            organizationConfig,
            databaseNamingStrategy,
            globalNamingStrategy
        );
    }

    /**
     * Build qualified table name with optional schema
     * @returns Fully qualified table name (e.g., 'schema.table' or 'table')
     */
    private getQualifiedTableName(): string {
        return this.schemaName ? `${this.schemaName}.${this.tableName}` : this.tableName;
    }

    /**
     * Find a organization by its ID
     */
    async findById(id: string): Promise<(Organization & TCustomFields) | null> {
        try {
            const tableName = this.getQualifiedTableName();
            const rows = await this.sql`
                SELECT
                    ${this.sql(this.configHelper.getColumnName('id'))} as id,
                    ${this.sql(this.configHelper.getColumnName('ownerUserId'))} as owner_user_id,
                    ${this.sql(this.configHelper.getColumnName('createdAt'))} as created_at,
                    ${this.sql(this.configHelper.getColumnName('updatedAt'))} as updated_at,
                    ${this.sql(this.configHelper.getColumnName('archivedAt'))} as archived_at,
                    ${this.sql(this.configHelper.getColumnName('deletedAt'))} as deleted_at
                    ${this.configHelper.hasCustomFields ? this.sql`, *` : this.sql``}
                FROM ${this.sql(tableName)}
                WHERE ${this.sql(this.configHelper.getColumnName('id'))} = ${id}
                LIMIT 1
            `;

            if (rows.length === 0) {
                return null;
            }

            return OrganizationMapper.toDomainWithCustom<TCustomFields>(
                rows[0],
                this.configHelper.columnMap,
                this.configHelper.hasCustomFields
                    ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                    : undefined
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to find organization by ID: ${message}`);
        }
    }

    /**
     * Find all organizations owned by a specific user
     */
    async findByOwner(ownerUserId: string): Promise<(Organization & TCustomFields)[]> {
        try {
            const tableName = this.getQualifiedTableName();
            const rows = await this.sql`
                SELECT
                    ${this.sql(this.configHelper.getColumnName('id'))} as id,
                    ${this.sql(this.configHelper.getColumnName('ownerUserId'))} as owner_user_id,
                    ${this.sql(this.configHelper.getColumnName('createdAt'))} as created_at,
                    ${this.sql(this.configHelper.getColumnName('updatedAt'))} as updated_at,
                    ${this.sql(this.configHelper.getColumnName('archivedAt'))} as archived_at,
                    ${this.sql(this.configHelper.getColumnName('deletedAt'))} as deleted_at
                    ${this.configHelper.hasCustomFields ? this.sql`, *` : this.sql``}
                FROM ${this.sql(tableName)}
                WHERE ${this.sql(this.configHelper.getColumnName('ownerUserId'))} = ${ownerUserId}
                ORDER BY ${this.sql(this.configHelper.getColumnName('createdAt'))} DESC
            `;

            return OrganizationMapper.toDomainArrayWithCustom<TCustomFields>(
                rows,
                this.configHelper.columnMap,
                this.configHelper.hasCustomFields
                    ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                    : undefined
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to find organizations by owner: ${message}`);
        }
    }

    /**
     * Save a organization (create or update)
     * @param organization The organization entity to save (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    async insert(
        organization: Organization & TCustomFields,
        _context?: OperationContext
    ): Promise<void> {
        try {
            // Build base columns with mapped column names
            const baseColumns: Record<string, any> = {
                [this.configHelper.getColumnName('id')]: organization.id,
                [this.configHelper.getColumnName('ownerUserId')]: organization.ownerUserId,
                [this.configHelper.getColumnName('createdAt')]:
                    organization.createdAt.toISOString(),
                [this.configHelper.getColumnName('updatedAt')]:
                    organization.updatedAt.toISOString(),
                [this.configHelper.getColumnName('archivedAt')]:
                    organization.archivedAt?.toISOString() ?? null,
                [this.configHelper.getColumnName('deletedAt')]:
                    organization.deletedAt?.toISOString() ?? null
            };

            // Convert custom fields to DB column map (uses namingStrategy + customMapper)
            const customFields = this.configHelper.customFieldsToDb(organization);

            // Merge base + custom fields
            const merged: Record<string, any> = {
                ...baseColumns,
                ...customFields
            };

            // Keep only keys where value is NOT undefined (null must be preserved)
            const columns: Record<string, any> = Object.fromEntries(
                Object.entries(merged).filter(([, value]) => value !== undefined)
            );

            const tableName = this.getQualifiedTableName();
            await this.sql`
                INSERT INTO ${this.sql(tableName)} ${this.sql(columns)}
            `;
        } catch (error: unknown) {
            console.log(error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to save organization: ${message}`);
        }
    }

    /**
     * Update an existing organization
     * @param organization The organization entity to update (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    async update(
        organization: Organization & TCustomFields,
        _context?: OperationContext
    ): Promise<void> {
        try {
            // Build base columns with mapped column names
            const columns: Record<string, any> = {
                [this.configHelper.getColumnName('id')]: organization.id,
                [this.configHelper.getColumnName('ownerUserId')]: organization.ownerUserId,
                [this.configHelper.getColumnName('createdAt')]:
                    organization.createdAt.toISOString(),
                [this.configHelper.getColumnName('updatedAt')]:
                    organization.updatedAt.toISOString(),
                [this.configHelper.getColumnName('archivedAt')]:
                    organization.archivedAt?.toISOString() ?? null,
                [this.configHelper.getColumnName('deletedAt')]:
                    organization.deletedAt?.toISOString() ?? null
            };

            // Add custom fields using helper (uses namingStrategy + customMapper)
            const rawCustomFields = this.configHelper.customFieldsToDb(organization);

            // Exclude undefined custom fields
            const cleanCustomFields = Object.fromEntries(
                Object.entries(rawCustomFields || {}).filter(([, v]) => v !== undefined)
            );

            // Merge core + custom
            Object.assign(columns, cleanCustomFields);

            // Prepare columns for SET (without id and undefined values)
            const idColumn = this.configHelper.getColumnName('id');
            const idValue = columns[idColumn];

            if (idValue === undefined || idValue === null) {
                throw new Error('Missing organization id for update');
            }

            // Remove id from columns to update
            const { [idColumn]: _omitId, ...rest } = columns;

            // Never send undefined (null is valid if you want to nullify)
            const setColumns = Object.fromEntries(
                Object.entries(rest).filter(([, v]) => v !== undefined)
            );

            // If no columns to update, exit silently
            if (Object.keys(setColumns).length === 0) {
                return;
            }

            // Simple UPDATE, no upsert or ON CONFLICT
            const tableName = this.getQualifiedTableName();
            await this.sql`
            UPDATE ${this.sql(tableName)}
            SET ${this.sql(setColumns)}
            WHERE ${this.sql(idColumn)} = ${idValue}
        `;
        } catch (error: unknown) {
            console.log(error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to update organization: ${message}`);
        }
    }

    /**
     * Delete a organization by ID
     * @param id The organization ID to delete
     * @param context Optional operation context for audit logging
     */
    async delete(id: string, _context?: OperationContext): Promise<void> {
        try {
            const tableName = this.getQualifiedTableName();
            await this.sql`
                DELETE FROM ${this.sql(tableName)}
                WHERE ${this.sql(this.configHelper.getColumnName('id'))} = ${id}
            `;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to delete organization: ${message}`);
        }
    }

    /**
     * Find multiple organizations by their IDs
     */
    async findByIds(ids: string[]): Promise<(Organization & TCustomFields)[]> {
        if (ids.length === 0) {
            return [];
        }

        try {
            const tableName = this.getQualifiedTableName();
            const rows = await this.sql`
                SELECT
                    ${this.sql(this.configHelper.getColumnName('id'))} as id,
                    ${this.sql(this.configHelper.getColumnName('ownerUserId'))} as owner_user_id,
                    ${this.sql(this.configHelper.getColumnName('createdAt'))} as created_at,
                    ${this.sql(this.configHelper.getColumnName('updatedAt'))} as updated_at,
                    ${this.sql(this.configHelper.getColumnName('archivedAt'))} as archived_at,
                    ${this.sql(this.configHelper.getColumnName('deletedAt'))} as deleted_at
                    ${this.configHelper.hasCustomFields ? this.sql`, *` : this.sql``}
                FROM ${this.sql(tableName)}
                WHERE ${this.sql(this.configHelper.getColumnName('id'))} = ANY(${ids})
                ORDER BY ${this.sql(this.configHelper.getColumnName('createdAt'))} DESC
            `;

            return OrganizationMapper.toDomainArrayWithCustom<TCustomFields>(
                rows,
                this.configHelper.columnMap,
                this.configHelper.hasCustomFields
                    ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                    : undefined
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to find organizations by IDs: ${message}`);
        }
    }

    /**
     * Count total number of organizations
     */
    async count(): Promise<number> {
        try {
            const tableName = this.getQualifiedTableName();
            const rows = await this.sql`
                SELECT COUNT(*) as count FROM ${this.sql(tableName)}
            `;

            return parseInt(rows[0]?.count || '0', 10);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to count organizations: ${message}`);
        }
    }

    /**
     * Find organizations with pagination and filtering
     */
    async findMany(options?: {
        limit?: number;
        offset?: number;
        status?: 'active' | 'archived';
        ownerUserId?: string;
    }): Promise<(Organization & TCustomFields)[]> {
        try {
            const limit = options?.limit || 100;
            const offset = options?.offset || 0;

            const tableName = this.getQualifiedTableName();

            // Build base SELECT clause with column mapping
            const selectClause = this.sql`
                SELECT
                    ${this.sql(this.configHelper.getColumnName('id'))} as id,
                    ${this.sql(this.configHelper.getColumnName('ownerUserId'))} as owner_user_id,
                    ${this.sql(this.configHelper.getColumnName('createdAt'))} as created_at,
                    ${this.sql(this.configHelper.getColumnName('updatedAt'))} as updated_at,
                    ${this.sql(this.configHelper.getColumnName('archivedAt'))} as archived_at,
                    ${this.sql(this.configHelper.getColumnName('deletedAt'))} as deleted_at
                    ${this.configHelper.hasCustomFields ? this.sql`, *` : this.sql``}
                FROM ${this.sql(tableName)}
            `;

            const ownerColumn = this.configHelper.getColumnName('ownerUserId');
            const createdAtColumn = this.configHelper.getColumnName('createdAt');

            let query: postgres.PendingQuery<postgres.Row[]>;

            if (options?.status && options?.ownerUserId) {
                // Both status and owner filters
                if (options.status === 'archived') {
                    query = this.sql`
                        ${selectClause}
                        WHERE ${this.sql(this.configHelper.getColumnName('deletedAt'))} IS NOT NULL AND ${this.sql(ownerColumn)} = ${options.ownerUserId}
                        ORDER BY ${this.sql(createdAtColumn)} DESC
                        LIMIT ${limit} OFFSET ${offset}
                    `;
                } else {
                    query = this.sql`
                        ${selectClause}
                        WHERE ${this.sql(this.configHelper.getColumnName('deletedAt'))} IS NULL AND ${this.sql(ownerColumn)} = ${options.ownerUserId}
                        ORDER BY ${this.sql(createdAtColumn)} DESC
                        LIMIT ${limit} OFFSET ${offset}
                    `;
                }
            } else if (options?.status) {
                // Only status filter
                if (options.status === 'archived') {
                    query = this.sql`
                        ${selectClause}
                        WHERE ${this.sql(this.configHelper.getColumnName('deletedAt'))} IS NOT NULL
                        ORDER BY ${this.sql(createdAtColumn)} DESC
                        LIMIT ${limit} OFFSET ${offset}
                    `;
                } else {
                    query = this.sql`
                        ${selectClause}
                        WHERE ${this.sql(this.configHelper.getColumnName('deletedAt'))} IS NULL
                        ORDER BY ${this.sql(createdAtColumn)} DESC
                        LIMIT ${limit} OFFSET ${offset}
                    `;
                }
            } else if (options?.ownerUserId) {
                // Only owner filter
                query = this.sql`
                    ${selectClause}
                    WHERE ${this.sql(ownerColumn)} = ${options.ownerUserId}
                    ORDER BY ${this.sql(createdAtColumn)} DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            } else {
                // No filters
                query = this.sql`
                    ${selectClause}
                    ORDER BY ${this.sql(createdAtColumn)} DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            }

            const rows = await query;
            return OrganizationMapper.toDomainArrayWithCustom<TCustomFields>(
                rows,
                this.configHelper.columnMap,
                this.configHelper.hasCustomFields
                    ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                    : undefined
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to find organizations: ${message}`);
        }
    }

    /**
     * Find active organizations by owner (convenience method)
     */
    async findActiveByOwner(ownerUserId: string): Promise<(Organization & TCustomFields)[]> {
        return this.findMany({
            status: 'active',
            ownerUserId
        });
    }

    /**
     * Find archived organizations by owner (convenience method)
     */
    async findArchivedByOwner(ownerUserId: string): Promise<(Organization & TCustomFields)[]> {
        return this.findMany({
            status: 'archived',
            ownerUserId
        });
    }

    /**
     * Count organizations by owner
     */
    async countByOwner(ownerUserId: string): Promise<number> {
        try {
            const tableName = this.getQualifiedTableName();
            const rows = await this.sql`
                SELECT COUNT(*) as count FROM ${this.sql(tableName)}
                WHERE ${this.sql(this.configHelper.getColumnName('ownerUserId'))} = ${ownerUserId}
            `;

            return parseInt(rows[0]?.count || '0', 10);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to count organizations by owner: ${message}`);
        }
    }
}
