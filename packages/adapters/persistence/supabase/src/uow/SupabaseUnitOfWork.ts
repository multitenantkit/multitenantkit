/**
 * Supabase Unit of Work Implementation
 *
 * IMPORTANT: This is a non-transactional implementation.
 * Supabase JS client does not support native database transactions.
 * Operations are executed sequentially without automatic rollback.
 *
 * For true ACID transactions, consider:
 * - Using PostgreSQL adapter with direct connection
 * - Implementing RPC/stored procedures in Supabase
 *
 * This implementation allows the framework to function with Supabase
 * while acknowledging the transactional limitations.
 */

import type {
    RepositoryBundle,
    ToolkitOptions,
    UnitOfWork
} from '@multitenantkit/domain-contracts';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseOrganizationMembershipRepository } from '../repositories/SupabaseOrganizationMembershipRepository';
import { SupabaseOrganizationRepository } from '../repositories/SupabaseOrganizationRepository';
import { SupabaseUserRepository } from '../repositories/SupabaseUserRepository';

/**
 * Supabase-based Unit of Work implementation
 *
 * NOTE: This is a non-transactional implementation that executes
 * operations sequentially. If an operation fails mid-way, previous
 * operations will NOT be rolled back automatically.
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository
 */
export class SupabaseUnitOfWork<
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TOrganizationMembershipCustomFields = {}
> implements
        UnitOfWork<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
{
    constructor(
        private readonly client: SupabaseClient,
        private readonly toolkitOptions?: ToolkitOptions<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) {}

    /**
     * Execute work with repository bundle
     *
     * WARNING: This is NOT a true database transaction.
     * Operations are executed sequentially without rollback capability.
     * If an operation fails, previous operations will persist.
     *
     * @param work - Function containing the operations to execute
     * @returns Result of the work function
     */
    async transaction<T>(
        work: (
            repos: RepositoryBundle<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        ) => Promise<T>
    ): Promise<T> {
        // Create repository bundle with the Supabase client
        const repos: RepositoryBundle<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        > = {
            users: new SupabaseUserRepository<TUserCustomFields>(
                this.client,
                this.toolkitOptions as any
            ),
            organizations: new SupabaseOrganizationRepository<TOrganizationCustomFields>(
                this.client,
                this.toolkitOptions as any
            ),
            organizationMemberships: new SupabaseOrganizationMembershipRepository<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >(this.client, this.toolkitOptions)
        };

        // Execute the work (non-transactional)
        return await work(repos);
    }
}
