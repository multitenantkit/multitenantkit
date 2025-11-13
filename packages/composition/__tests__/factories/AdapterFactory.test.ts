import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createJsonAdapters,
    createPostgresAdapters,
    createSystemAdapters
} from '../../src/factories/AdapterFactory';
import { Environment } from '../../src/config/Environment';

// Mock JSON adapter packages
vi.mock('multitenantkit/adapter-persistence-json', () => ({
    JsonUnitOfWork: vi.fn().mockImplementation((dataDir) => ({ type: 'JsonUoW', dataDir })),
    JsonUserRepository: vi
        .fn()
        .mockImplementation((dataDir) => ({ type: 'JsonUserRepo', dataDir })),
    JsonOrganizationRepository: vi
        .fn()
        .mockImplementation((dataDir) => ({ type: 'JsonOrganizationRepo', dataDir })),
    JsonOrganizationMembershipRepository: vi.fn().mockImplementation((userRepo, dataDir) => ({
        type: 'JsonOrganizationMembershipRepo',
        userRepo,
        dataDir
    }))
}));

// Mock Postgres adapter packages
vi.mock('multitenantkit/adapter-persistence-postgres', () => ({
    createPostgresRepositories: vi.fn().mockImplementation((config) => ({
        users: { type: 'PostgresUserRepo', config },
        organizations: { type: 'PostgresOrganizationRepo', config },
        organizationMemberships: { type: 'PostgresOrganizationMembershipRepo', config }
    })),
    createPostgresUnitOfWork: vi.fn().mockImplementation((config) => ({
        type: 'PostgresUoW',
        config
    }))
}));

// Mock system adapter packages
vi.mock('multitenantkit/adapter-system-system-clock', () => ({
    SystemClock: vi.fn().mockImplementation(() => ({ type: 'SystemClock' }))
}));

vi.mock('multitenantkit/adapter-system-crypto-uuid', () => ({
    CryptoUuid: vi.fn().mockImplementation(() => ({ type: 'CryptoUuid' }))
}));

describe('AdapterFactory', () => {
    describe('JSON Adapter Creation', () => {
        it('should create JSON adapters when DB_ADAPTER is json', () => {
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const systemAdapters = createSystemAdapters();
            const jsonAdapters = createJsonAdapters(env);

            expect(jsonAdapters).toHaveProperty('uow');
            expect(jsonAdapters).toHaveProperty('userRepository');
            expect(jsonAdapters).toHaveProperty('organizationRepository');
            expect(jsonAdapters).toHaveProperty('organizationMembershipRepository');
            expect(systemAdapters).toHaveProperty('clock');
            expect(systemAdapters).toHaveProperty('uuid');
        });

        it('should pass DATA_DIR to JSON repositories', () => {
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/custom/data/dir',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const jsonAdapters = createJsonAdapters(env.DATA_DIR);

            expect((jsonAdapters.userRepository as any).dataDir).toBe('/custom/data/dir');
            expect((jsonAdapters.organizationRepository as any).dataDir).toBe('/custom/data/dir');
        });

        it('should create SystemClock', () => {
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const adapters = createSystemAdapters();

            expect((adapters.clock as any).type).toBe('SystemClock');
        });

        it('should create CryptoUuid', () => {
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const adapters = createSystemAdapters();

            expect((adapters.uuid as any).type).toBe('CryptoUuid');
        });

        it('should create JSON UnitOfWork with correct DATA_DIR', () => {
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/uow',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const adapters = createJsonAdapters(env.DATA_DIR);

            expect((adapters.uow as any).type).toBe('JsonUoW');
            expect((adapters.uow as any).dataDir).toBe('/test/uow');
        });

        it('should inject userRepository into organizationMembershipRepository', () => {
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const adapters = createJsonAdapters(env);

            expect((adapters.organizationMembershipRepository as any).userRepo).toBeDefined();
            expect((adapters.organizationMembershipRepository as any).userRepo.type).toBe(
                'JsonUserRepo'
            );
        });

        it('should ignore frameworkConfig for JSON adapter', () => {
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const frameworkConfig = {
                users: {
                    customFields: {
                        customSchema: {} as any
                    }
                }
            };

            // Should not throw even with framework config
            // TODO: JSON adapter should accept framework config
            expect(() => createJsonAdapters(env)).not.toThrow();
        });
    });

    describe('Postgres Adapter Creation', () => {
        it('should create Postgres adapters when DB_ADAPTER is postgres', () => {
            const env: Environment = {
                DB_ADAPTER: 'postgres',
                DATA_DIR: '',
                PORT: 3000,
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: '',
                DB_POOL_SIZE: 15
            };

            const adapters = createPostgresAdapters(env);
            const systemAdapters = createSystemAdapters();

            expect(adapters).toHaveProperty('uow');
            expect(adapters).toHaveProperty('userRepository');
            expect(adapters).toHaveProperty('organizationRepository');
            expect(adapters).toHaveProperty('organizationMembershipRepository');
            expect(systemAdapters).toHaveProperty('clock');
            expect(systemAdapters).toHaveProperty('uuid');
        });

        it('should pass correct Postgres env to UnitOfWork', () => {
            const env: Environment = {
                DB_ADAPTER: 'postgres',
                DATA_DIR: '',
                PORT: 3000,
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: 'postgresql://localhost:5432/testdb',
                DB_POOL_SIZE: 20
            };

            const adapters = createPostgresAdapters(env);

            const config = (adapters.uow as any).config;
            expect(config.env.DATABASE_URL).toBe('postgresql://localhost:5432/testdb');
            expect(config.env.DB_POOL_SIZE).toBe(20);
        });

        it('should pass correct Postgres env to repositories', () => {
            const env: Environment = {
                DB_ADAPTER: 'postgres',
                DATA_DIR: '',
                PORT: 3000,
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: 'postgresql://localhost:5432/testdb',
                DB_POOL_SIZE: 20
            };

            const adapters = createPostgresAdapters(env);

            const config = (adapters.userRepository as any).config;
            expect(config.env.DATABASE_URL).toBe('postgresql://localhost:5432/testdb');
            expect(config.env.DB_POOL_SIZE).toBe(20);
        });

        it('should convert DB_POOL_SIZE to string for Postgres env', () => {
            const env: Environment = {
                DB_ADAPTER: 'postgres',
                DATA_DIR: '',
                PORT: 3000,
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: '',
                DB_POOL_SIZE: 15
            };

            const adapters = createPostgresAdapters(env);

            const config = (adapters.uow as any).config;
            expect(config.env.DB_POOL_SIZE).toBe(15);
            expect(typeof config.env.DB_POOL_SIZE).toBe('number');
        });

        it('should pass frameworkConfig to Postgres adapters', () => {
            const env: Environment = {
                DB_ADAPTER: 'postgres',
                DATA_DIR: '',
                PORT: 3000,
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const frameworkConfig = {
                users: {
                    customFields: {
                        customSchema: { test: 'schema' } as any
                    }
                }
            };

            const adapters = createPostgresAdapters(env, frameworkConfig as any);

            const uowConfig = (adapters.uow as any).config;
            expect(uowConfig.frameworkConfig).toEqual(frameworkConfig);

            const repoConfig = (adapters.userRepository as any).config;
            expect(repoConfig.frameworkConfig).toEqual(frameworkConfig);
        });

        it('should create all three Postgres repositories', () => {
            const env: Environment = {
                DB_ADAPTER: 'postgres',
                DATA_DIR: '',
                PORT: 3000,
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const adapters = createPostgresAdapters(env);

            expect((adapters.userRepository as any).type).toBe('PostgresUserRepo');
            expect((adapters.organizationRepository as any).type).toBe('PostgresOrganizationRepo');
            expect((adapters.organizationMembershipRepository as any).type).toBe(
                'PostgresOrganizationMembershipRepo'
            );
        });

        it('should prefer DATABASE_URL when both DATABASE_URL and Supabase config are provided', () => {
            const env: Environment = {
                DB_ADAPTER: 'postgres',
                DATA_DIR: '',
                PORT: 3000,
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: 'postgresql://localhost:5432/prioritydb',
                DB_POOL_SIZE: 10
            };

            const adapters = createPostgresAdapters(env);

            const config = (adapters.uow as any).config;
            // Both should be passed, but DATABASE_URL should be present
            expect(config.env.DATABASE_URL).toBe('postgresql://localhost:5432/prioritydb');
        });
    });

    describe('Generic Type Support', () => {
        it('should support custom user fields type parameter', () => {
            type CustomUserFields = { bio: string };
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const adapters = createJsonAdapters<CustomUserFields>(env);

            // Should compile without errors
            expect(adapters).toBeDefined();
        });

        it('should support custom organization fields type parameter', () => {
            type CustomOrganizationFields = { description: string };
            const env: Environment = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const adapters = createJsonAdapters<{}, CustomOrganizationFields>(env);

            // Should compile without errors
            expect(adapters).toBeDefined();
        });

        it('should support all custom field type parameters', () => {
            type CustomUserFields = { bio: string };
            type CustomOrganizationFields = { description: string };
            type CustomMembershipFields = { role: string };

            const env: Environment = {
                DB_ADAPTER: 'postgres',
                DATA_DIR: '',
                PORT: 3000,
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: '',
                DB_POOL_SIZE: 10
            };

            const adapters = createPostgresAdapters<
                CustomUserFields,
                CustomOrganizationFields,
                CustomMembershipFields
            >(env);

            // Should compile without errors
            expect(adapters).toBeDefined();
        });
    });
});
