/**
 * @module @multitenantkit/sdk-supabase
 *
 * MultiTenantKit SDK for Supabase Edge Functions (Deno compatible)
 *
 * This SDK provides everything you need to run MultiTenantKit in Supabase Edge Functions
 * without any Node.js dependencies.
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

// Re-export persistence adapter
export {
    createSupabaseClient,
    createSupabaseConfig,
    createSupabaseRepositories,
    type SupabaseClient,
    type SupabaseConfig,
    type SupabaseFactoryOptions,
    type SupabaseRepositoryBundle
} from '@multitenantkit/adapter-persistence-supabase';

// Re-export system adapter
export { WebCryptoUuid } from '@multitenantkit/adapter-system-web-crypto';

// Export factories
export {
    type CreateSupabaseAdaptersOptions,
    createSupabaseAdapters
} from './factories/AdapterFactory';
export { createUseCases } from './factories/UseCaseFactory';
