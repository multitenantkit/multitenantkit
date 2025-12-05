/**
 * Supabase Persistence Adapter
 *
 * This adapter provides a Supabase implementation of the domain repository ports.
 * It works in both Node.js and Deno/Edge Functions environments.
 *
 * Key Features:
 * - Uses @supabase/supabase-js client
 * - Works in Node.js and Deno
 * - No Node.js-specific APIs (no node:crypto, node:fs, etc.)
 * - Compatible with Supabase Edge Functions
 *
 * @example
 * ```typescript
 * import { createSupabaseAdapters } from '@multitenantkit/adapter-persistence-supabase';
 * import { createUseCases } from '@multitenantkit/composition';
 * import { createClient } from '@supabase/supabase-js';
 *
 * const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 * const adapters = createSupabaseAdapters({ client });
 * const useCases = createUseCases(adapters);
 * ```
 */

// Client and Configuration
export {
    createSupabaseClient,
    createSupabaseConfig,
    type SupabaseClient,
    type SupabaseConfig
} from './client/SupabaseClient';

// Factory Functions - Main entry points
export {
    type CreateSupabaseAdaptersOptions,
    createSupabaseAdapters,
    createSupabaseRepositories,
    createWebSystemAdapters,
    type SupabaseFactoryOptions,
    type SupabaseRepositoryBundle
} from './factory/SupabaseFactory';

// Use Case Factory (Deno compatible - no Node.js dependencies)
export { createUseCases } from './factory/UseCaseFactory';
// Mappers
export { type OrganizationDbRow, OrganizationMapper } from './mappers/OrganizationMapper';
export {
    type OrganizationMembershipDbRow,
    OrganizationMembershipMapper
} from './mappers/OrganizationMembershipMapper';
export { type UserDbRow, UserMapper } from './mappers/UserMapper';

// Repositories
export { SupabaseOrganizationMembershipRepository } from './repositories/SupabaseOrganizationMembershipRepository';
export { SupabaseOrganizationRepository } from './repositories/SupabaseOrganizationRepository';
export { SupabaseUserRepository } from './repositories/SupabaseUserRepository';

// System Adapters (Deno compatible)
export { WebClock } from './system/WebClock';
export { WebCryptoUuid } from './system/WebCryptoUuid';
