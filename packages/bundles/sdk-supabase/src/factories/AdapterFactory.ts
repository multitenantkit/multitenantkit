/**
 * Supabase Adapter Factory
 *
 * Creates complete adapters bundle for Supabase Edge Functions.
 * Uses Web Crypto API for UUID generation (Deno compatible).
 * Applies Supabase-specific defaults automatically.
 */

import { createSupabaseRepositories } from '@multitenantkit/adapter-persistence-supabase';
import { WebCryptoUuid } from '@multitenantkit/adapter-system-web-crypto';
import type {
    Adapters,
    ClockPort,
    PersistenceAdapters,
    SystemAdapters,
    ToolkitOptions,
    UserCustomFieldsConfig
} from '@multitenantkit/domain-contracts';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Simple clock implementation using standard Date API
 * Deno compatible - no Node.js dependencies
 */
class WebClock implements ClockPort {
    now(): Date {
        return new Date();
    }
}

/**
 * Merges user-provided ToolkitOptions with Supabase-specific defaults.
 *
 * Supabase defaults applied:
 * - namingStrategy: 'snake_case'
 * - users.database: { schema: 'auth', table: 'users' }
 * - users.customFields.columnMapping: { externalId: 'id', username: 'email' }
 * - users.customFields.customMapper: maps to/from raw_user_meta_data
 * - organizations.database: { schema: 'public', table: 'organizations' }
 * - organizationMemberships.database: { schema: 'public', table: 'organization_memberships' }
 *
 * User-provided options take precedence over defaults.
 */
export function applySupabaseDefaults<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
>(
    options?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): ToolkitOptions<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    // Default Supabase customMapper for users (maps to raw_user_meta_data)
    const supabaseUserMapper = {
        toDb: (fields: unknown) => ({
            raw_user_meta_data: {
                ...(fields as Record<string, unknown>),
                email_verified: true,
                phone_verified: false
            }
        }),
        toDomain: (dbRow: Record<string, unknown>) => {
            const metadata = (dbRow.raw_user_meta_data as Record<string, unknown>) || {};
            // biome-ignore lint/correctness/noUnusedVariables: intentionally extracted to exclude
            const { sub, email_verified, phone_verified, ...customFields } = metadata;
            return customFields;
        }
    };

    // Default Supabase columnMapping for users
    const supabaseUserColumnMapping = {
        externalId: 'id',
        username: 'email'
    };

    // Build users config with Supabase defaults
    const usersConfig = {
        customFields: {
            // User's customSchema if provided
            ...(options?.users?.customFields?.customSchema && {
                customSchema: options.users.customFields.customSchema
            }),
            // Use user's columnMapping or Supabase default
            columnMapping: options?.users?.customFields?.columnMapping ?? supabaseUserColumnMapping,
            // Use user's customMapper or Supabase default (only if customSchema is provided)
            ...(options?.users?.customFields?.customSchema && {
                customMapper: options?.users?.customFields?.customMapper ?? supabaseUserMapper
            })
        } as UserCustomFieldsConfig<TUserCustomFields>,
        database: {
            schema: options?.users?.database?.schema ?? 'auth',
            table: options?.users?.database?.table ?? 'users',
            ...(options?.users?.database?.namingStrategy && {
                namingStrategy: options.users.database.namingStrategy
            })
        }
    };

    // Build organizations config with Supabase defaults
    const organizationsConfig = {
        ...(options?.organizations?.customFields && {
            customFields: options.organizations.customFields
        }),
        database: {
            schema: options?.organizations?.database?.schema ?? 'public',
            table: options?.organizations?.database?.table ?? 'organizations',
            ...(options?.organizations?.database?.namingStrategy && {
                namingStrategy: options.organizations.database.namingStrategy
            })
        }
    };

    // Build organization memberships config with Supabase defaults
    const organizationMembershipsConfig = {
        ...(options?.organizationMemberships?.customFields && {
            customFields: options.organizationMemberships.customFields
        }),
        database: {
            schema: options?.organizationMemberships?.database?.schema ?? 'public',
            table: options?.organizationMemberships?.database?.table ?? 'organization_memberships',
            ...(options?.organizationMemberships?.database?.namingStrategy && {
                namingStrategy: options.organizationMemberships.database.namingStrategy
            })
        }
    };

    return {
        namingStrategy: options?.namingStrategy ?? 'snake_case',
        users: usersConfig,
        organizations: organizationsConfig,
        organizationMemberships: organizationMembershipsConfig,
        // Pass through other options as-is
        ...(options?.useCaseHooks && { useCaseHooks: options.useCaseHooks }),
        ...(options?.responseTransformers && { responseTransformers: options.responseTransformers })
    };
}

/**
 * Options for creating Supabase adapters
 */
export interface CreateSupabaseAdaptersOptions<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    /** Supabase client instance */
    client: SupabaseClient;
    /**
     * Toolkit options for custom fields and database configuration.
     * Supabase defaults are applied automatically (auth.users, snake_case, etc.)
     * Your options take precedence over defaults.
     */
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
}

/**
 * Result of createSupabaseAdapters including adapters and resolved toolkitOptions
 */
export interface SupabaseAdaptersResult<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    /** The adapters bundle (persistence + system) */
    adapters: Adapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
    /** The toolkit options with Supabase defaults applied */
    toolkitOptions: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
}

/**
 * Create complete Supabase adapters bundle (persistence + system)
 *
 * This is the main factory function for Supabase/Deno environments.
 * It creates all necessary adapters with NO Node.js dependencies.
 *
 * **Supabase defaults applied automatically:**
 * - `namingStrategy: 'snake_case'`
 * - `users.database: { schema: 'auth', table: 'users' }`
 * - `users.customFields.columnMapping: { externalId: 'id', username: 'email' }`
 * - `organizations.database: { schema: 'public', table: 'organizations' }`
 * - `organizationMemberships.database: { schema: 'public', table: 'organization_memberships' }`
 *
 * Your options take precedence over defaults.
 *
 * @example
 * ```typescript
 * import { createSupabaseAdapters, createUseCases } from '@multitenantkit/sdk-supabase';
 * import { createClient } from '@supabase/supabase-js';
 *
 * const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 * const { adapters, toolkitOptions } = createSupabaseAdapters({ client });
 * const useCases = createUseCases(adapters, toolkitOptions);
 * ```
 */
export function createSupabaseAdapters<
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TOrganizationMembershipCustomFields = {}
>(
    options: CreateSupabaseAdaptersOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): SupabaseAdaptersResult<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    const { client, toolkitOptions: userOptions } = options;

    // Apply Supabase defaults to toolkit options
    const toolkitOptions = applySupabaseDefaults<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(userOptions);

    // Create persistence adapters using Supabase repositories
    const persistence = createSupabaseRepositories<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >({ client, toolkitOptions });

    // Create system adapters using Web APIs (Deno compatible)
    const system: SystemAdapters = {
        clock: new WebClock(),
        uuid: new WebCryptoUuid()
    };

    const adapters: Adapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    > = {
        persistence: persistence as unknown as PersistenceAdapters<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >,
        system
    };

    return { adapters, toolkitOptions };
}
