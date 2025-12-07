/**
 * Supabase User Repository
 *
 * Implements UserRepository using Supabase client.
 * Works in both Node.js and Deno/Edge Functions environments.
 */

import type { ToolkitOptions, User, UserRepository } from '@multitenantkit/domain-contracts';
import { UserRepositoryConfigHelper } from '@multitenantkit/domain-contracts';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type UserDbRow, UserMapper } from '../mappers/UserMapper';

/**
 * Supabase implementation of UserRepository
 *
 * Generic support for custom fields and column mapping:
 * - TCustomFields: Additional fields beyond the base User
 * - Column mapping: Map framework field names to custom database column names
 */
// biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default for optional custom fields
export class SupabaseUserRepository<TCustomFields = {}> implements UserRepository {
    private readonly configHelper: UserRepositoryConfigHelper<TCustomFields>;
    private readonly schemaName?: string;
    private readonly tableName: string;

    constructor(
        private readonly client: SupabaseClient,
        toolkitOptions?: ToolkitOptions<TCustomFields, unknown, unknown>
    ) {
        // DEBUG: Log what we're receiving
        console.log('[SupabaseUserRepository] toolkitOptions received:', !!toolkitOptions);
        console.log('[SupabaseUserRepository] toolkitOptions.users:', !!toolkitOptions?.users);
        console.log(
            '[SupabaseUserRepository] toolkitOptions.users.customFields:',
            !!toolkitOptions?.users?.customFields
        );
        console.log(
            '[SupabaseUserRepository] toolkitOptions.users.customFields.customSchema:',
            !!toolkitOptions?.users?.customFields?.customSchema
        );
        console.log(
            '[SupabaseUserRepository] toolkitOptions.users.database:',
            toolkitOptions?.users?.database
        );

        // Extract user custom fields config from toolkit options
        const userConfig = toolkitOptions?.users?.customFields;

        // Extract database configuration with defaults
        this.schemaName = toolkitOptions?.users?.database?.schema;
        this.tableName = toolkitOptions?.users?.database?.table || 'users';

        // Extract naming strategies
        const databaseNamingStrategy = toolkitOptions?.users?.database?.namingStrategy;
        const globalNamingStrategy = toolkitOptions?.namingStrategy;

        // Use helper to handle configuration logic
        this.configHelper = new UserRepositoryConfigHelper(
            userConfig,
            databaseNamingStrategy,
            globalNamingStrategy
        );

        // DEBUG: Log the result
        console.log(
            '[SupabaseUserRepository] configHelper.hasCustomFields:',
            this.configHelper.hasCustomFields
        );
        console.log('[SupabaseUserRepository] schemaName:', this.schemaName);
        console.log('[SupabaseUserRepository] tableName:', this.tableName);
    }

    /**
     * Get the Supabase query builder for the users table
     */
    private getTable() {
        if (this.schemaName) {
            return this.client.schema(this.schemaName).from(this.tableName);
        }
        return this.client.from(this.tableName);
    }

    /**
     * Build select columns string
     */
    private getSelectColumns(): string {
        const cols = [
            `${this.configHelper.getColumnName('id')}`,
            `${this.configHelper.getColumnName('externalId')}`,
            `${this.configHelper.getColumnName('username')}`,
            `${this.configHelper.getColumnName('createdAt')}`,
            `${this.configHelper.getColumnName('updatedAt')}`,
            `${this.configHelper.getColumnName('deletedAt')}`
        ];

        // If custom fields exist, select all columns
        if (this.configHelper.hasCustomFields) {
            return '*';
        }

        return cols.join(', ');
    }

    /**
     * Map database row to domain entity
     */
    private mapToDomain(row: UserDbRow): User & TCustomFields {
        return UserMapper.toDomainWithCustom<TCustomFields>(
            row,
            this.configHelper.columnMap,
            this.configHelper.hasCustomFields
                ? (dbRow) => this.configHelper.customFieldsToDomain(dbRow)
                : undefined
        );
    }

    /**
     * Find a user by their ID
     */
    async findById(id: string): Promise<(User & TCustomFields) | null> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .eq(this.configHelper.getColumnName('id'), id)
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return this.mapToDomain(data as unknown as UserDbRow);
    }

    /**
     * Find a user by their username (case-insensitive)
     */
    async findByUsername(username: string): Promise<(User & TCustomFields) | null> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .ilike(this.configHelper.getColumnName('username'), username)
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return this.mapToDomain(data as unknown as UserDbRow);
    }

    /**
     * Find user by external ID (auth provider ID) - case-insensitive
     */
    async findByExternalId(externalId: string): Promise<(User & TCustomFields) | null> {
        const { data, error } = await this.getTable()
            .select(this.getSelectColumns())
            .eq(this.configHelper.getColumnName('externalId'), externalId)
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return this.mapToDomain(data as unknown as UserDbRow);
    }

    /**
     * Insert a new user
     */
    async insert(user: User & TCustomFields, _context?: OperationContext): Promise<void> {
        // Build columns object with mapped column names
        const columns: Record<string, unknown> = {
            [this.configHelper.getColumnName('id')]: user.id,
            [this.configHelper.getColumnName('externalId')]: user.externalId,
            [this.configHelper.getColumnName('username')]: user.username,
            [this.configHelper.getColumnName('createdAt')]: user.createdAt.toISOString(),
            [this.configHelper.getColumnName('updatedAt')]: user.updatedAt.toISOString(),
            [this.configHelper.getColumnName('deletedAt')]: user.deletedAt?.toISOString() ?? null
        };

        // Add custom fields using helper
        const customFields = this.configHelper.customFieldsToDb(user);
        Object.assign(columns, customFields);

        const { error } = await this.getTable().insert(columns);

        if (error) {
            throw new Error(`Failed to insert user: ${error.message}`);
        }
    }

    /**
     * Update an existing user
     */
    async update(user: User & TCustomFields, _context?: OperationContext): Promise<void> {
        const columns: Record<string, unknown> = {
            [this.configHelper.getColumnName('externalId')]: user.externalId,
            [this.configHelper.getColumnName('username')]: user.username,
            [this.configHelper.getColumnName('updatedAt')]: user.updatedAt.toISOString(),
            [this.configHelper.getColumnName('deletedAt')]: user.deletedAt?.toISOString() ?? null
        };

        // Add custom fields using helper
        const rawCustom = this.configHelper.customFieldsToDb(user);
        const cleanCustom = Object.fromEntries(
            Object.entries(rawCustom || {}).filter(([, v]) => v !== undefined)
        );
        Object.assign(columns, cleanCustom);

        // Remove undefined values
        const updateData = Object.fromEntries(
            Object.entries(columns).filter(([, v]) => v !== undefined)
        );

        const { error } = await this.getTable()
            .update(updateData)
            .eq(this.configHelper.getColumnName('id'), user.id);

        if (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    /**
     * Delete a user by ID
     */
    async delete(id: string, _context?: OperationContext): Promise<void> {
        const { error } = await this.getTable()
            .delete()
            .eq(this.configHelper.getColumnName('id'), id);

        if (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }
}
