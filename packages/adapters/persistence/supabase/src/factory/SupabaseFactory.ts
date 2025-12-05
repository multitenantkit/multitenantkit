/**
 * Supabase Repository Factory
 *
 * Creates all Supabase repositories with shared configuration.
 * Deno/Edge Functions compatible - no Node.js dependencies.
 */

import type {
    Adapters,
    PersistenceAdapters,
    SystemAdapters,
    ToolkitOptions
} from '@multitenantkit/domain-contracts';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseOrganizationMembershipRepository } from '../repositories/SupabaseOrganizationMembershipRepository';
import { SupabaseOrganizationRepository } from '../repositories/SupabaseOrganizationRepository';
import { SupabaseUserRepository } from '../repositories/SupabaseUserRepository';
import { WebClock } from '../system/WebClock';
import { WebCryptoUuid } from '../system/WebCryptoUuid';

/**
 * Options for creating Supabase repositories
 */
export interface SupabaseFactoryOptions<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    /** Supabase client instance */
    client: SupabaseClient;
    /** Toolkit options for custom fields and database configuration */
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
}

/**
 * Bundle of Supabase repositories
 */
export interface SupabaseRepositoryBundle<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    userRepository: SupabaseUserRepository<TUserCustomFields>;
    organizationRepository: SupabaseOrganizationRepository<TOrganizationCustomFields>;
    organizationMembershipRepository: SupabaseOrganizationMembershipRepository<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
}

/**
 * Create all Supabase repositories
 *
 * @example
 * ```typescript
 * const client = createSupabaseClient(config);
 * const repos = createSupabaseRepositories({
 *     client,
 *     toolkitOptions: {
 *         namingStrategy: 'snake_case',
 *         users: { database: { schema: 'auth', table: 'users' } }
 *     }
 * });
 * ```
 */
export function createSupabaseRepositories<
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TOrganizationMembershipCustomFields = {}
>(
    options: SupabaseFactoryOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): SupabaseRepositoryBundle<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    const { client, toolkitOptions } = options;

    return {
        userRepository: new SupabaseUserRepository<TUserCustomFields>(
            client,
            toolkitOptions as any
        ),
        organizationRepository: new SupabaseOrganizationRepository<TOrganizationCustomFields>(
            client,
            toolkitOptions as any
        ),
        organizationMembershipRepository: new SupabaseOrganizationMembershipRepository<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(client, toolkitOptions)
    };
}

/**
 * Create system adapters using Web APIs (Deno compatible)
 *
 * Uses:
 * - WebCryptoUuid: crypto.randomUUID() - Web Crypto API
 * - WebClock: new Date() - standard Date API
 *
 * @returns SystemAdapters compatible with Deno/Edge Functions
 */
export function createWebSystemAdapters(): SystemAdapters {
    return {
        clock: new WebClock(),
        uuid: new WebCryptoUuid()
    };
}

/**
 * Options for creating complete Supabase adapters
 */
export interface CreateSupabaseAdaptersOptions<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    /** Supabase client instance */
    client: SupabaseClient;
    /** Toolkit options for custom fields and database configuration */
    toolkitOptions?: ToolkitOptions<
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
 * @example
 * ```typescript
 * import { createSupabaseAdapters } from '@multitenantkit/adapter-persistence-supabase';
 * import { createUseCases } from '@multitenantkit/composition';
 *
 * const adapters = createSupabaseAdapters({ client: supabaseClient });
 * const useCases = createUseCases(adapters);
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
): Adapters<TUserCustomFields, TOrganizationCustomFields, TOrganizationMembershipCustomFields> {
    const { client, toolkitOptions } = options;

    // Create persistence adapters
    const persistence = createSupabaseRepositories<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >({ client, toolkitOptions });

    // Create system adapters (Web API based, Deno compatible)
    const system = createWebSystemAdapters();

    return {
        persistence: persistence as unknown as PersistenceAdapters<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >,
        system
    };
}
