import type { RepositoryBundle, ToolkitOptions } from '@multitenantkit/domain-contracts';
import { DatabaseClient } from '../client/PostgresClient';
import { createDatabaseConfig, type PostgresDBEnvVars } from '../client/PostgresConfig';
import { PostgresOrganizationMembershipRepository } from '../repositories/PostgresOrganizationMembershipRepository';
import { PostgresOrganizationRepository } from '../repositories/PostgresOrganizationRepository';
import { PostgresUserRepository } from '../repositories/PostgresUserRepository';
import { PostgresUnitOfWork } from '../uow/PostgresUnitOfWork';

/**
 * Factory for creating PostgreSQL repositories
 * Provides a centralized way to create and configure all PostgreSQL-based repositories
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export interface PostgresRepositoryBundle<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
> extends RepositoryBundle<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    > {
    users: PostgresUserRepository<TUserCustomFields>;
    organizations: PostgresOrganizationRepository<TOrganizationCustomFields>;
    organizationMemberships: PostgresOrganizationMembershipRepository<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
}

/**
 * Configuration options for database factory
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export interface DatabaseFactoryOptions<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
> {
    env?: PostgresDBEnvVars;
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
}

/**
 * Create PostgreSQL repositories with shared client
 * @param options - Configuration options including repository-specific configs
 * @returns Repository bundle with all PostgreSQL repositories
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository (inferred from toolkitOptions)
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export function createPostgresRepositories<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    options: DatabaseFactoryOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    > = {}
): PostgresRepositoryBundle<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    // Create configuration from options or environment
    const config = createDatabaseConfig(options.env || (process.env as PostgresDBEnvVars));

    // Create shared database client
    const databaseClient = new DatabaseClient(config);
    const sql = databaseClient.getSql();

    // Create repositories with shared SQL client and complete toolkit options
    return {
        users: new PostgresUserRepository<TUserCustomFields>(sql, options.toolkitOptions),
        organizations: new PostgresOrganizationRepository<TOrganizationCustomFields>(
            sql,
            options.toolkitOptions
        ),
        organizationMemberships: new PostgresOrganizationMembershipRepository<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(sql, options.toolkitOptions)
    };
}

/**
 * Create PostgreSQL Unit of Work
 * @param options - Configuration options including repository-specific configs
 * @returns Configured PostgresUnitOfWork instance
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository (inferred from toolkitOptions)
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export function createPostgresUnitOfWork<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    options: DatabaseFactoryOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    > = {}
): PostgresUnitOfWork<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    // Create configuration from options or environment
    const config = createDatabaseConfig(options.env || (process.env as PostgresDBEnvVars));

    // Create database client
    const databaseClient = new DatabaseClient(config);
    const sql = databaseClient.getSql();

    return new PostgresUnitOfWork<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(sql, options.toolkitOptions);
}
