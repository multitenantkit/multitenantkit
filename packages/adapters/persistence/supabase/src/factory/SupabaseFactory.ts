/**
 * Supabase Repository Factory
 *
 * Creates all Supabase repositories with shared configuration.
 */

import type { ToolkitOptions } from '@multitenantkit/domain-contracts';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseOrganizationMembershipRepository } from '../repositories/SupabaseOrganizationMembershipRepository';
import { SupabaseOrganizationRepository } from '../repositories/SupabaseOrganizationRepository';
import { SupabaseUserRepository } from '../repositories/SupabaseUserRepository';

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
