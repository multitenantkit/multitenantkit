import { DatabaseClient } from '../client/PostgresClient';
import { createDatabaseConfig, PostgresDBEnvVars } from '../client/PostgresConfig';
import { PostgresUserRepository } from '../repositories/PostgresUserRepository';
import { PostgresOrganizationRepository } from '../repositories/PostgresOrganizationRepository';
import { PostgresOrganizationMembershipRepository } from '../repositories/PostgresOrganizationMembershipRepository';
import { PostgresUnitOfWork } from '../uow/PostgresUnitOfWork';
import { FrameworkConfig, RepositoryBundle } from '@multitenantkit/domain-contracts';

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
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
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
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
> {
    env?: PostgresDBEnvVars;
    frameworkConfig?: FrameworkConfig<
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
 * @template TUserCustomFields - Custom fields for UserRepository (inferred from frameworkConfig)
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export function createPostgresRepositories<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
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

    // Create repositories with shared SQL client and complete framework config
    return {
        users: new PostgresUserRepository<TUserCustomFields>(sql, options.frameworkConfig),
        organizations: new PostgresOrganizationRepository<TOrganizationCustomFields>(
            sql,
            options.frameworkConfig
        ),
        organizationMemberships: new PostgresOrganizationMembershipRepository<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(sql, options.frameworkConfig)
    };
}

/**
 * Create PostgreSQL Unit of Work
 * @param options - Configuration options including repository-specific configs
 * @returns Configured PostgresUnitOfWork instance
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository (inferred from frameworkConfig)
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export function createPostgresUnitOfWork<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
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
    >(sql, options.frameworkConfig);
}
