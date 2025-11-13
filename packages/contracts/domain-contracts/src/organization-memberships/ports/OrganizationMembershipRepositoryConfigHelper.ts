import type { OrganizationMembershipCustomFieldsConfig } from './OrganizationMembershipCustomFieldsConfig';
import {
    ORGANIZATION_MEMBERSHIP_BASE_FIELDS,
    type OrganizationMembershipBaseField
} from './OrganizationMembershipCustomFieldsConfig';

/**
 * Helper class for OrganizationMembershipRepository implementations
 * Provides common utilities for handling OrganizationMembershipCustomFieldsConfig
 *
 * Benefits:
 * - Reusable across all repository implementations (PostgreSQL, JSON, MongoDB, etc.)
 * - Centralizes column mapping logic
 * - Type-safe access to custom fields and mappers
 * - Composition over inheritance approach
 */
export class OrganizationMembershipRepositoryConfigHelper<TCustomFields = {}> {
    /**
     * Resolved column mapping (generated from namingStrategy + user overrides)
     */
    readonly columnMap: Record<OrganizationMembershipBaseField, string>;

    /**
     * Custom mapper functions (if provided)
     */
    readonly customMapper?: {
        toDb: (fields: TCustomFields) => Record<string, any>;
        toDomain: (dbRow: Record<string, any>) => TCustomFields;
    };

    /**
     * Naming strategy for custom fields transformation
     */
    readonly namingStrategy: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';

    /**
     * Whether custom fields are configured
     */
    readonly hasCustomFields: boolean;

    private readonly config?: OrganizationMembershipCustomFieldsConfig<TCustomFields>;

    constructor(
        config?: OrganizationMembershipCustomFieldsConfig<TCustomFields>,
        databaseNamingStrategy?: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase',
        globalNamingStrategy?: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase'
    ) {
        this.config = config;

        // Precedence: database.namingStrategy > global.namingStrategy > 'snake_case' (default)
        this.namingStrategy =
            databaseNamingStrategy || // Entity-specific (recommended)
            globalNamingStrategy || // Global default
            'snake_case'; // Default is snake_case for SQL databases

        // Generate column mapping dynamically from namingStrategy
        const generatedColumnMap = this.generateColumnMap(
            ORGANIZATION_MEMBERSHIP_BASE_FIELDS,
            this.namingStrategy
        );

        // Apply user overrides from columnMapping
        this.columnMap = {
            ...generatedColumnMap,
            ...config?.columnMapping
        } as Record<OrganizationMembershipBaseField, string>;

        this.customMapper = config?.customMapper;

        // Custom fields are present if there's a schema or a custom mapper
        this.hasCustomFields = !!(config?.customSchema || config?.customMapper);
    }

    /**
     * Get the storage column/field name for a framework field
     *
     * Example:
     * - getColumnName('id') → 'id'
     * - getColumnName('userId') → 'user_id' (with snake_case)
     * - getColumnName('userId') → 'member_id' (with columnMapping override)
     */
    getColumnName(field: OrganizationMembershipBaseField): string {
        return this.columnMap[field];
    }

    /**
     * Generate column mapping from base fields using namingStrategy
     */
    private generateColumnMap(
        baseFields: readonly string[],
        strategy: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase'
    ): Record<string, string> {
        const result: Record<string, string> = {};

        for (const field of baseFields) {
            result[field] = this.transformKey(field, strategy);
        }

        return result;
    }

    /**
     * Convert custom domain fields to storage format
     *
     * Process:
     * - If customMapper exists: Use it exclusively (has complete precedence)
     * - Otherwise: Apply namingStrategy transformation (if customSchema exists)
     */
    customFieldsToDb(fields: TCustomFields): Record<string, any> {
        // If customMapper exists, it has complete precedence over namingStrategy
        if (this.customMapper) {
            return this.customMapper.toDb(fields);
        }

        // Otherwise, apply namingStrategy transformation
        return this.inferCustomFieldsToDb(fields);
    }

    /**
     * Convert storage format to custom domain fields
     *
     * Process:
     * - If customMapper exists: Use it exclusively (has complete precedence)
     * - Otherwise: Apply reverse namingStrategy transformation (if customSchema exists)
     */
    customFieldsToDomain(dbRow: Record<string, any>): TCustomFields {
        // If customMapper exists, it has complete precedence over namingStrategy
        if (this.customMapper) {
            return this.customMapper.toDomain(dbRow);
        }

        // Otherwise, apply reverse namingStrategy transformation
        return this.inferCustomFieldsFromDb(dbRow);
    }

    /**
     * Infer custom fields from domain to storage using namingStrategy
     * Extracts keys from Zod schema and transforms them according to naming strategy
     */
    private inferCustomFieldsToDb(fields: TCustomFields): Record<string, any> {
        if (!this.config?.customSchema) {
            return {};
        }

        // For z.object() schemas, shape is available directly
        const schema = this.config.customSchema as any;
        const schemaShape = schema.shape || schema._def?.shape;

        if (!schemaShape) {
            return {};
        }

        const result: Record<string, any> = {};

        for (const domainKey of Object.keys(schemaShape)) {
            if (domainKey in (fields as any) && (fields as any)[domainKey] !== undefined) {
                const dbKey = this.transformKey(domainKey, this.namingStrategy);
                result[dbKey] = (fields as any)[domainKey];
            }
        }

        return result;
    }

    /**
     * Infer custom fields from storage to domain using reverse namingStrategy
     * Extracts keys from Zod schema and reverse-transforms them
     */
    private inferCustomFieldsFromDb(dbRow: Record<string, any>): TCustomFields {
        if (!this.config?.customSchema) {
            return {} as TCustomFields;
        }

        // For z.object() schemas, shape is available directly
        const schema = this.config.customSchema as any;
        const schemaShape = schema.shape || schema._def?.shape;

        if (!schemaShape) {
            return {} as TCustomFields;
        }

        const result: any = {};

        for (const domainKey of Object.keys(schemaShape)) {
            const dbKey = this.transformKey(domainKey, this.namingStrategy);

            if (dbKey in dbRow) {
                result[domainKey] = dbRow[dbKey];
            }
        }

        return result as TCustomFields;
    }

    /**
     * Transform a key according to the naming strategy
     *
     * @param key - The key to transform (in camelCase)
     * @param strategy - The naming strategy to apply
     * @returns The transformed key
     */
    private transformKey(
        key: string,
        strategy: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase'
    ): string {
        switch (strategy) {
            case 'snake_case':
                // camelCase → snake_case: invitedBy → invited_by
                return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            case 'kebab-case':
                // camelCase → kebab-case: invitedBy → invited-by
                return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
            case 'PascalCase':
                // camelCase → PascalCase: invitedBy → InvitedBy
                return key.charAt(0).toUpperCase() + key.slice(1);
            case 'camelCase':
            default:
                // No transformation
                return key;
        }
    }

    /**
     * Validate custom fields using the schema (if provided)
     * Returns the validated fields or throws validation error
     */
    validateCustomFields(fields: TCustomFields): TCustomFields {
        if (!this.config?.customSchema) {
            return fields;
        }
        return this.config.customSchema.parse(fields);
    }
}
