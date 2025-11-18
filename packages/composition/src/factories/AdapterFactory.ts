import { HttpMetricsAdapter, type HttpMetricsConfig } from '@multitenantkit/adapter-metrics-http';
import {
    JsonOrganizationMembershipRepository,
    JsonOrganizationRepository,
    JsonUnitOfWork,
    JsonUserRepository
} from '@multitenantkit/adapter-persistence-json';
import {
    createPostgresRepositories,
    createPostgresUnitOfWork,
    type PostgresDBEnvVars
} from '@multitenantkit/adapter-persistence-postgres';
import { CryptoUuid } from '@multitenantkit/adapter-system-crypto-uuid';
import { SystemClock } from '@multitenantkit/adapter-system-system-clock';
import type {
    MetricsPort,
    PersistenceAdapters,
    SystemAdapters,
    ToolkitOptions
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
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
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
 * @template TUserCustomFields - Custom fields for Users (extracted from toolkitOptions)
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export function createPostgresAdapters<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    env: PostgresDBEnvVars = {},
    toolkitOptions?: ToolkitOptions<
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
        toolkitOptions
    });
    const repositories = createPostgresRepositories<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >({
        env: postgresEnv,
        toolkitOptions
    });

    return {
        uow: unitOfWork,
        userRepository: repositories.users,
        organizationRepository: repositories.organizations,
        organizationMembershipRepository: repositories.organizationMemberships
    };
}
