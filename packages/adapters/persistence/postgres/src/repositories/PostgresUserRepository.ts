import {
    type ToolkitOptions,
    type User,
    type UserRepository,
    UserRepositoryConfigHelper
} from '@multitenantkit/domain-contracts';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import type postgres from 'postgres';
import { UserMapper } from '../mappers/UserMapper';

/**
 * PostgreSQL implementation of UserRepository
 * Handles all user-related database operations using direct SQL queries
 *
 * Generic support for custom fields and column mapping:
 * - TCustomFields: Additional fields beyond the base User
 * - Column mapping: Map framework field names to custom database column names
 */
// biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default for optional custom fields
export class PostgresUserRepository<TCustomFields = {}> implements UserRepository {
    private readonly configHelper: UserRepositoryConfigHelper<TCustomFields>;
    private readonly schemaName?: string;
    private readonly tableName: string;
    private readonly fullTableName: string;

    constructor(
        private readonly sql: postgres.Sql,
        toolkitOptions?: ToolkitOptions<TCustomFields, any, any>
    ) {
        // Extract user custom fields config from toolkit options
        const userConfig = toolkitOptions?.users?.customFields;

        // Extract database configuration with defaults
        this.schemaName = toolkitOptions?.users?.database?.schema;
        this.tableName = toolkitOptions?.users?.database?.table || 'users';
        this.fullTableName = this.schemaName
            ? `${this.schemaName}.${this.tableName}`
            : this.tableName;

        // Extract naming strategies
        const databaseNamingStrategy = toolkitOptions?.users?.database?.namingStrategy;
        const globalNamingStrategy = toolkitOptions?.namingStrategy;

        // Use helper to handle configuration logic
        this.configHelper = new UserRepositoryConfigHelper(
            userConfig,
            databaseNamingStrategy,
            globalNamingStrategy
        );
    }

    /**
     * Find a user by their ID
     */
    async findById(id: string): Promise<(User & TCustomFields) | null> {
        try {
            const rows = await this.sql`
                SELECT
                    ${this.sql(this.configHelper.getColumnName('id'))} as id,
                    ${this.sql(this.configHelper.getColumnName('externalId'))} as external_id,
                    ${this.sql(this.configHelper.getColumnName('username'))} as username,
                    ${this.sql(this.configHelper.getColumnName('createdAt'))} as created_at,
                    ${this.sql(this.configHelper.getColumnName('updatedAt'))} as updated_at,
                    ${this.sql(this.configHelper.getColumnName('deletedAt'))} as deleted_at
                    ${this.configHelper.hasCustomFields ? this.sql`, *` : this.sql``}
                FROM ${this.sql(this.fullTableName)}
                WHERE ${this.sql(this.configHelper.getColumnName('id'))} = ${id}
                LIMIT 1
            `;

            if (rows.length === 0) {
                return null;
            }

            return UserMapper.toDomainWithCustom<TCustomFields>(
                rows[0],
                this.configHelper.columnMap,
                this.configHelper.hasCustomFields
                    ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                    : undefined
            );
        } catch (error: any) {
            throw new Error(`Failed to find user by ID: ${error.message}`);
        }
    }

    /**
     * Find a user by their username
     */
    async findByUsername(username: string): Promise<(User & TCustomFields) | null> {
        try {
            const rows = await this.sql`
                SELECT
                    ${this.sql(this.configHelper.getColumnName('id'))} as id,
                    ${this.sql(this.configHelper.getColumnName('externalId'))} as external_id,
                    ${this.sql(this.configHelper.getColumnName('username'))} as username,
                    ${this.sql(this.configHelper.getColumnName('createdAt'))} as created_at,
                    ${this.sql(this.configHelper.getColumnName('updatedAt'))} as updated_at,
                    ${this.sql(this.configHelper.getColumnName('deletedAt'))} as deleted_at
                    ${this.configHelper.hasCustomFields ? this.sql`, *` : this.sql``}
                FROM ${this.sql(this.fullTableName)}
                WHERE LOWER((${this.sql(this.configHelper.getColumnName('username'))})::text) = LOWER((${username})::text)
                LIMIT 1
            `;

            if (rows.length === 0) {
                return null;
            }

            return UserMapper.toDomainWithCustom<TCustomFields>(
                rows[0],
                this.configHelper.columnMap,
                this.configHelper.hasCustomFields
                    ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                    : undefined
            );
        } catch (error: any) {
            throw new Error(`Failed to find user by username: ${error.message}`);
        }
    }

    /**
     * Find user by external ID (auth provider ID)
     */
    async findByExternalId(externalId: string): Promise<(User & TCustomFields) | null> {
        try {
            const rows = await this.sql`
                SELECT
                    ${this.sql(this.configHelper.getColumnName('id'))} as id,
                    ${this.sql(this.configHelper.getColumnName('externalId'))} as external_id,
                    ${this.sql(this.configHelper.getColumnName('username'))} as username,
                    ${this.sql(this.configHelper.getColumnName('createdAt'))} as created_at,
                    ${this.sql(this.configHelper.getColumnName('updatedAt'))} as updated_at,
                    ${this.sql(this.configHelper.getColumnName('deletedAt'))} as deleted_at
                    ${this.configHelper.hasCustomFields ? this.sql`, *` : this.sql``}
                FROM ${this.sql(this.fullTableName)}
                WHERE LOWER((${this.sql(this.configHelper.getColumnName('externalId'))})::text) = LOWER((${externalId})::text)
                LIMIT 1
            `;

            if (rows.length === 0) {
                return null;
            }

            return UserMapper.toDomainWithCustom<TCustomFields>(
                rows[0],
                this.configHelper.columnMap,
                this.configHelper.hasCustomFields
                    ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                    : undefined
            );
        } catch (error: any) {
            throw new Error(`Failed to find user by external ID: ${error.message}`);
        }
    }

    /**
     * Save a user (create or update)
     * @param user The user entity to save (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    async insert(user: User & TCustomFields, _context?: OperationContext): Promise<void> {
        try {
            // Build columns object with mapped column names
            const columns: Record<string, any> = {
                [this.configHelper.getColumnName('id')]: user.id,
                [this.configHelper.getColumnName('externalId')]: user.externalId,
                [this.configHelper.getColumnName('username')]: user.username,
                [this.configHelper.getColumnName('createdAt')]: user.createdAt.toISOString(),
                [this.configHelper.getColumnName('updatedAt')]: user.updatedAt.toISOString(),
                [this.configHelper.getColumnName('deletedAt')]:
                    user.deletedAt?.toISOString() ?? null
            };

            // Add custom fields using helper (uses namingStrategy + customMapper)
            const customFields = this.configHelper.customFieldsToDb(user);
            Object.assign(columns, customFields);

            await this.sql`
                INSERT INTO ${this.sql(this.fullTableName)} ${this.sql(columns)}
            `;
        } catch (error: any) {
            throw new Error(`Failed to save user: ${error.message}`);
        }
    }

    /**
     * Update a user (no upsert)
     * @param user The user entity to update (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    async update(user: User & TCustomFields, _context?: OperationContext): Promise<void> {
        try {
            const columns: Record<string, any> = {
                [this.configHelper.getColumnName('id')]: user.id,
                [this.configHelper.getColumnName('externalId')]: user.externalId,
                [this.configHelper.getColumnName('username')]: user.username,
                [this.configHelper.getColumnName('createdAt')]: user.createdAt.toISOString(),
                [this.configHelper.getColumnName('updatedAt')]: user.updatedAt.toISOString(),
                [this.configHelper.getColumnName('deletedAt')]:
                    user.deletedAt?.toISOString() ?? null
            };

            // Add custom fields using helper (uses namingStrategy + customMapper)
            const rawCustom = this.configHelper.customFieldsToDb(user);
            const cleanCustom = Object.fromEntries(
                Object.entries(rawCustom || {}).filter(([, v]) => v !== undefined)
            );

            // Merge base + custom
            Object.assign(columns, cleanCustom);

            // Validate and isolate the id
            const idColumn = this.configHelper.getColumnName('id');
            const idValue = columns[idColumn];
            if (idValue === undefined || idValue === null) {
                throw new Error('Missing user id for update');
            }

            // Remove id from columns to update
            const { [idColumn]: _omitId, ...rest } = columns;

            // SET without undefined (null will clear the field)
            const setColumns = Object.fromEntries(
                Object.entries(rest).filter(([, v]) => v !== undefined)
            );

            // If there are no columns to update, exit
            if (Object.keys(setColumns).length === 0) return;

            // UPDATE simple
            await this.sql`
            UPDATE ${this.sql(this.fullTableName)}
            SET ${this.sql(setColumns)}
            WHERE ${this.sql(idColumn)} = ${idValue}
        `;
        } catch (error: any) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    /**
     * Delete a user by ID
     * @param id The user ID to delete
     * @param context Optional operation context for audit logging
     */
    async delete(id: string, _context?: OperationContext): Promise<void> {
        try {
            await this.sql`
                DELETE FROM ${this.sql(this.fullTableName)}
                WHERE ${this.sql(this.configHelper.getColumnName('id'))} = ${id}
            `;
        } catch (error: any) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }
}
