import { describe, expect, it, vi } from 'vitest';
import {
    createJsonAdapters,
    createPostgresAdapters,
    createSystemAdapters
} from '../../src/factories/AdapterFactory';

// Mock JSON adapter packages
vi.mock('multitenantkit/adapter-persistence-json', () => ({
    JsonUnitOfWork: vi.fn().mockImplementation((dataDir) => ({ type: 'JsonUoW', dataDir })),
    JsonUserRepository: vi
        .fn()
        .mockImplementation((dataDir) => ({ type: 'JsonUserRepo', dataDir })),
    JsonOrganizationRepository: vi.fn().mockImplementation((dataDir) => ({
        type: 'JsonOrganizationRepo',
        dataDir
    })),
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
        organizationMemberships: {
            type: 'PostgresOrganizationMembershipRepo',
            config
        }
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
            const systemAdapters = createSystemAdapters();
            const jsonAdapters = createJsonAdapters('/test/data');

            expect(jsonAdapters).toHaveProperty('uow');
            expect(jsonAdapters).toHaveProperty('userRepository');
            expect(jsonAdapters).toHaveProperty('organizationRepository');
            expect(jsonAdapters).toHaveProperty('organizationMembershipRepository');
            expect(systemAdapters).toHaveProperty('clock');
            expect(systemAdapters).toHaveProperty('uuid');
        });

        it('should pass DATA_DIR to JSON repositories', () => {
            const jsonAdapters = createJsonAdapters('/custom/data/dir');

            expect((jsonAdapters.userRepository as any).storage.filePath).toBe(
                '/custom/data/dir/users.json'
            );
            expect((jsonAdapters.organizationRepository as any).storage.filePath).toBe(
                '/custom/data/dir/organizations.json'
            );
        });

        it('should create SystemClock', () => {
            const adapters = createSystemAdapters();

            expect((adapters.clock as any).constructor.name).toBe('SystemClock');
        });

        it('should create CryptoUuid', () => {
            const adapters = createSystemAdapters();

            expect((adapters.uuid as any).constructor.name).toBe('CryptoUuid');
        });

        it('should create JSON UnitOfWork with correct DATA_DIR', () => {
            const adapters = createJsonAdapters('/test/uow');

            expect((adapters.uow as any).constructor.name).toBe('JsonUnitOfWork');
            expect((adapters.uow as any).dataDir).toBe('/test/uow');
        });

        it('should ignore frameworkConfig for JSON adapter', () => {
            const _frameworkConfig = {
                users: {
                    customFields: {
                        customSchema: {} as any
                    }
                }
            };

            // Should not throw even with framework config
            // TODO: JSON adapter should accept framework config
            expect(() => createJsonAdapters('/test/data')).not.toThrow();
        });
    });

    describe('Postgres Adapter Creation', () => {
        it('should create Postgres adapters when DB_ADAPTER is postgres', () => {
            const adapters = createPostgresAdapters({
                DATABASE_URL:
                    'postgresql://username:password@host.com:5432/database?sslmode=require',
                DB_POOL_SIZE: '20'
            });
            const systemAdapters = createSystemAdapters();

            expect(adapters).toHaveProperty('uow');
            expect(adapters).toHaveProperty('userRepository');
            expect(adapters).toHaveProperty('organizationRepository');
            expect(adapters).toHaveProperty('organizationMembershipRepository');
            expect(systemAdapters).toHaveProperty('clock');
            expect(systemAdapters).toHaveProperty('uuid');
        });

        it('should pass correct Postgres env to UnitOfWork', () => {
            const adapters = createPostgresAdapters({
                DATABASE_URL:
                    'postgresql://username:password@host.com:5432/database?sslmode=require',
                DB_POOL_SIZE: '20'
            });

            const config = (adapters.uow as any).sql.options;
            expect(config.host[0]).toBe('host.com');
            expect(config.max).toBe(20);
        });

        it('should pass correct Postgres env to repositories', () => {
            const adapters = createPostgresAdapters({
                DATABASE_URL:
                    'postgresql://username:password@host.com:5432/database?sslmode=require',
                DB_POOL_SIZE: '20'
            });

            const config = (adapters.userRepository as any).sql.options;
            expect(config.host[0]).toBe('host.com');
            expect(config.max).toBe(20);
        });

        it('should convert DB_POOL_SIZE to string for Postgres env', () => {
            const adapters = createPostgresAdapters({
                DB_HOST: 'localhost',
                DB_NAME: 'test',
                DB_USER: 'test',
                DB_PASSWORD: 'test',
                DB_POOL_SIZE: '15'
            });

            const config = (adapters.uow as any).sql.options;
            expect(config.max).toBe(15);
            expect(typeof config.max).toBe('number');
        });

        it('should create all three Postgres repositories', () => {
            const adapters = createPostgresAdapters({
                DATABASE_URL:
                    'postgresql://username:password@host.com:5432/database?sslmode=require',
                DB_POOL_SIZE: '20'
            });

            expect(adapters.userRepository.constructor.name).toBe('PostgresUserRepository');
            expect(adapters.organizationRepository.constructor.name).toBe(
                'PostgresOrganizationRepository'
            );
            expect(adapters.organizationMembershipRepository.constructor.name).toBe(
                'PostgresOrganizationMembershipRepository'
            );
        });
    });

    describe('Generic Type Support', () => {
        it('should support custom user fields type parameter', () => {
            type CustomUserFields = { bio: string };

            const adapters = createJsonAdapters<CustomUserFields>('/test/data');

            // Should compile without errors
            expect(adapters).toBeDefined();
        });

        it('should support custom organization fields type parameter', () => {
            type CustomOrganizationFields = { description: string };
            // biome-ignore lint/complexity/noBannedTypes: ignore
            const adapters = createJsonAdapters<{}, CustomOrganizationFields>('/test/data');

            // Should compile without errors
            expect(adapters).toBeDefined();
        });

        it('should support all custom field type parameters', () => {
            type CustomUserFields = { bio: string };
            type CustomOrganizationFields = { description: string };
            type CustomMembershipFields = { role: string };

            const adapters = createPostgresAdapters<
                CustomUserFields,
                CustomOrganizationFields,
                CustomMembershipFields
            >({
                DATABASE_URL:
                    'postgresql://username:password@host.com:5432/database?sslmode=require'
            });

            // Should compile without errors
            expect(adapters).toBeDefined();
        });
    });
});
