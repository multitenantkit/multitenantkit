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
 * import { createSupabaseRepositories } from '@multitenantkit/adapter-persistence-supabase';
 * import { createClient } from '@supabase/supabase-js';
 *
 * const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 * const repositories = createSupabaseRepositories({ client });
 * ```
 */

// Client and Configuration
export {
    createSupabaseClient,
    createSupabaseConfig,
    type SupabaseClient,
    type SupabaseConfig
} from './client/SupabaseClient';

// Factory Functions
export {
    createSupabaseRepositories,
    type SupabaseFactoryOptions,
    type SupabaseRepositoryBundle
} from './factory/SupabaseFactory';

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

// Unit of Work
export { SupabaseUnitOfWork } from './uow/SupabaseUnitOfWork';
