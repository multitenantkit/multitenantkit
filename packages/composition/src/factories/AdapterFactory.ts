import {
    JsonUnitOfWork,
    JsonUserRepository,
    JsonOrganizationRepository,
    JsonOrganizationMembershipRepository
} from '@multitenantkit/adapter-persistence-json';

import {
    createPostgresRepositories,
    createPostgresUnitOfWork,
    type PostgresDBEnvVars
} from '@multitenantkit/adapter-persistence-postgres';

import { SystemClock } from '@multitenantkit/adapter-system-system-clock';
import { CryptoUuid } from '@multitenantkit/adapter-system-crypto-uuid';
import { HttpMetricsAdapter, HttpMetricsConfig } from '@multitenantkit/adapter-metrics-http';
import {
    FrameworkConfig,
    MetricsPort,
    PersistenceAdapters,
    SystemAdapters
} from '@multitenantkit/domain-contracts';

/**
 * Create system ports
 * @returns { ClockPort, UuidPort }
 */
export function createSystemAdapters(): SystemAdapters {
    return {
        clock: new SystemClock(),
        uuid: new CryptoUuid()
    };
}

/**
 * Create metrics port based on environment configuration
 * Returns undefined if metrics are disabled
 */
export function createMetricsAdapter(config?: HttpMetricsConfig): MetricsPort | undefined {
    return new HttpMetricsAdapter(config);
}

/**
 * Create JSON-based adapters
 * Note: JSON adapter doesn't support custom fields, so we cast to any
 */
export function createJsonAdapters<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
>(
    dataDir: string
): PersistenceAdapters<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    // Create persistence adapters
    const unitOfWork = new JsonUnitOfWork(dataDir);
    const userRepository = new JsonUserRepository(dataDir);
    const organizationRepository = new JsonOrganizationRepository<TOrganizationCustomFields>(
        dataDir
    );
    const organizationMembershipRepository = new JsonOrganizationMembershipRepository<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(userRepository as any, organizationRepository as any, dataDir);

    return {
        uow: unitOfWork as any,
        userRepository: userRepository as any,
        organizationRepository: organizationRepository as any,
        organizationMembershipRepository: organizationMembershipRepository as any
    };
}

/**
 * Create PostgreSQL-based adapters
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users (extracted from frameworkConfig)
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export function createPostgresAdapters<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
>(
    env: PostgresDBEnvVars = {},
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): PersistenceAdapters<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    // Create PostgreSQL configuration from environment
    const postgresEnv: PostgresDBEnvVars = {
        ...process.env,
        ...env
        // DATABASE_URL: env.DATABASE_URL ?? process.env.DATABASE_URL,
        // DB_POOL_SIZE: env.DB_POOL_SIZE?.toString() ?? process.env.DB_POOL_SIZE?.toString()
    };

    // Create persistence adapters with custom fields configuration
    const unitOfWork = createPostgresUnitOfWork<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >({
        env: postgresEnv,
        frameworkConfig
    });
    const repositories = createPostgresRepositories<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >({
        env: postgresEnv,
        frameworkConfig
    });

    return {
        uow: unitOfWork,
        userRepository: repositories.users,
        organizationRepository: repositories.organizations,
        organizationMembershipRepository: repositories.organizationMemberships
    };
}
