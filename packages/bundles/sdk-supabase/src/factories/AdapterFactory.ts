/**
 * Supabase Adapter Factory
 *
 * Creates complete adapters bundle for Supabase Edge Functions.
 * Uses Web Crypto API for UUID generation (Deno compatible).
 */

import { createSupabaseRepositories } from '@multitenantkit/adapter-persistence-supabase';
import { WebCryptoUuid } from '@multitenantkit/adapter-system-web-crypto';
import type {
    Adapters,
    ClockPort,
    PersistenceAdapters,
    SystemAdapters,
    ToolkitOptions
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
 * Options for creating Supabase adapters
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
 * import { createSupabaseAdapters, createUseCases } from '@multitenantkit/sdk-supabase';
 * import { createClient } from '@supabase/supabase-js';
 *
 * const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 * const adapters = createSupabaseAdapters({ client });
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

    return {
        persistence: persistence as unknown as PersistenceAdapters<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >,
        system
    };
}
