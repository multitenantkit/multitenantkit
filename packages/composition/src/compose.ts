import type { PostgresDBEnvVars } from '@multitenantkit/adapter-persistence-postgres';
import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import {
    createMetricsAdapter,
    createPostgresAdapters,
    createSystemAdapters
} from './factories/AdapterFactory';
import { createUseCases } from './factories/UseCaseFactory';

/**
 * Result of the composition process
 * Contains all use cases ready to be used
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export interface CompositionResult<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    _TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    _TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    _TOrganizationMembershipCustomFields = {}
> {
    useCases: UseCases;
    // Future: Expose toolkit options type for type inference
    // _config?: ToolkitOptions<TUserCustomFields, TOrganizationCustomFields, TOrganizationMembershipCustomFields>;
}

/**
 * Main composition function - Dependency Injection Container
 * This is the heart of the application architecture
 *
 * This function wires together all the application dependencies:
 * - Environment configuration
 * - toolkit options (custom fields, features, etc.) per vertical slice
 * - Infrastructure adapters (repositories, UoW, ports)
 * - Use cases (business logic)
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users (inferred from toolkitOptions)
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export function compose<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    envOverrides?: Record<string, string | undefined>,
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): CompositionResult<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    // 1. Load and validate environment
    const environment = { ...process.env, ...envOverrides };

    // 2. Create infrastructure adapters with slice configurations
    const persistenceAdapters = createPostgresAdapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(environment as unknown as PostgresDBEnvVars, toolkitOptions);

    const systemAdapters = createSystemAdapters();
    const metricsAdapter = createMetricsAdapter();

    // 3. Create use cases with injected dependencies and toolkit options
    const useCases = createUseCases<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(
        {
            persistence: persistenceAdapters,
            system: systemAdapters,
            observability: metricsAdapter
        },
        toolkitOptions
    );

    // 4. Return composition result
    return {
        useCases
    };
}

/**
 * Test-friendly composition function with sensible defaults
 * Automatically sets NODE_ENV=test and LOG_LEVEL=error for tests
 *
 * @param envOverrides - Partial environment overrides for testing
 * @param toolkitOptions - Optional toolkit options
 */
export function composeForTesting<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    envOverrides?: Partial<Record<string, string | number | undefined>>,
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): CompositionResult<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    // Apply test defaults
    const testDefaults = {
        NODE_ENV: 'test',
        LOG_LEVEL: 'error',
        DB_ADAPTER: 'json',
        DATA_DIR: './data',
        PORT: '3000',
        DATABASE_URL: '',
        DB_POOL_SIZE: '10'
    };

    // Merge with overrides, converting all values to strings
    const testEnv = {
        ...testDefaults,
        ...Object.fromEntries(
            Object.entries(envOverrides || {}).map(([key, value]) => [
                key,
                value !== undefined ? String(value) : undefined
            ])
        )
    };

    return compose(testEnv, toolkitOptions);
}
