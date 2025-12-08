/**
 * @module @multitenantkit/sdk-supabase
 *
 * MultiTenantKit SDK for Supabase Edge Functions (Deno compatible)
 *
 * This SDK provides everything you need to run MultiTenantKit in Supabase Edge Functions
 * without any Node.js dependencies.
 *
 * **Supabase defaults applied automatically:**
 * - `namingStrategy: 'snake_case'`
 * - `users.database: { schema: 'public', table: 'profiles' }`
 * - `users.customFields.columnMapping: { externalId: 'external_id', username: 'username' }`
 * - `organizations.database: { schema: 'public', table: 'organizations' }`
 * - `organizationMemberships.database: { schema: 'public', table: 'organization_memberships' }`
 *
 * Note: We use `public.profiles` instead of `auth.users` because:
 * - `auth.users` is not accessible via PostgREST (Supabase JS client)
 * - `auth.users` is managed by GoTrue and shouldn't be modified directly
 * - `public.profiles` gives you full control over user profile data
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

// Export factories and utilities
export {
    applySupabaseDefaults,
    type CreateSupabaseAdaptersOptions,
    createSupabaseAdapters,
    type SupabaseAdaptersResult
} from './factories/AdapterFactory';
export { createUseCases } from './factories/UseCaseFactory';
