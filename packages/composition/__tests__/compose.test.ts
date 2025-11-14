import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compose, composeForTesting } from '../src/compose';

// Mock AdapterFactory to prevent real database configuration validation
vi.mock('../src/factories/AdapterFactory', () => ({
    createPostgresAdapters: vi.fn().mockImplementation(() => ({
        uow: { type: 'PostgresUoW' },
        userRepository: { type: 'PostgresUserRepo' },
        organizationRepository: { type: 'PostgresOrganizationRepo' },
        organizationMembershipRepository: { type: 'PostgresOrganizationMembershipRepo' }
    })),
    createJsonAdapters: vi.fn().mockImplementation(() => ({
        uow: { type: 'JsonUoW' },
        userRepository: { type: 'JsonUserRepo' },
        organizationRepository: { type: 'JsonOrganizationRepo' },
        organizationMembershipRepository: { type: 'JsonOrganizationMembershipRepo' }
    })),
    createSystemAdapters: vi.fn().mockImplementation(() => ({
        clock: { now: () => new Date() },
        uuid: { generate: () => 'uuid' }
    })),
    createMetricsAdapter: vi.fn().mockImplementation(() => ({
        type: 'HttpMetrics'
    }))
}));

// Mock UseCaseFactory to return mock use cases
vi.mock('../src/factories/UseCaseFactory', () => ({
    createUseCases: vi.fn().mockImplementation(() => ({
        users: {
            createUser: vi.fn(),
            getUser: vi.fn(),
            updateUser: vi.fn(),
            listUserOrganizations: vi.fn(),
            deleteUser: vi.fn()
        },
        organizations: {
            createOrganization: vi.fn(),
            getOrganization: vi.fn(),
            updateOrganization: vi.fn(),
            listOrganizationMembers: vi.fn(),
            deleteOrganization: vi.fn(),
            archiveOrganization: vi.fn(),
            restoreOrganization: vi.fn(),
            transferOrganizationOwnership: vi.fn()
        },
        memberships: {
            addOrganizationMember: vi.fn(),
            removeOrganizationMember: vi.fn(),
            updateOrganizationMemberRole: vi.fn(),
            leaveOrganization: vi.fn(),
            listOrganizationMembers: vi.fn()
        }
    }))
}));

describe('compose', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Successful Composition', () => {
        it('should compose successfully with valid JSON configuration', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'test',
                LOG_LEVEL: 'error'
            };

            const result = compose(envOverrides);

            expect(result).toHaveProperty('useCases');
            expect(result.useCases).toHaveProperty('users');
            expect(result.useCases).toHaveProperty('organizations');
            expect(result.useCases).toHaveProperty('memberships');
        });

        it('should compose successfully with valid Postgres configuration', () => {
            const envOverrides = {
                DB_ADAPTER: 'postgres',
                PORT: '3000',
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb'
            };

            const result = compose(envOverrides);

            expect(result).toHaveProperty('useCases');
        });

        it('should return use cases with all slices', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'test'
            };

            const { useCases } = compose(envOverrides);

            // User use cases
            expect(useCases.users.createUser).toBeDefined();
            expect(useCases.users.getUser).toBeDefined();
            expect(useCases.users.updateUser).toBeDefined();
            expect(useCases.users.listUserOrganizations).toBeDefined();

            // Organization use cases
            expect(useCases.organizations.createOrganization).toBeDefined();
            expect(useCases.organizations.getOrganization).toBeDefined();
            expect(useCases.organizations.updateOrganization).toBeDefined();
            expect(useCases.organizations.listOrganizationMembers).toBeDefined();

            // Membership use cases
            expect(useCases.memberships.addOrganizationMember).toBeDefined();
            expect(useCases.memberships.removeOrganizationMember).toBeDefined();
            expect(useCases.memberships.updateOrganizationMemberRole).toBeDefined();
            expect(useCases.memberships.leaveOrganization).toBeDefined();
        });
    });

    describe.skip('Environment Loading and Validation', () => {
        it('should load environment from process.env when no overrides provided', () => {
            process.env.DB_ADAPTER = 'json';
            process.env.DATA_DIR = '/env/data';
            process.env.PORT = '4000';
            process.env.NODE_ENV = 'development';

            expect(() => compose()).not.toThrow();
        });

        it('should merge envOverrides with loaded environment', () => {
            process.env.DB_ADAPTER = 'json';
            process.env.DATA_DIR = '/env/data';
            process.env.PORT = '3000';
            process.env.NODE_ENV = 'development';

            const envOverrides = {
                PORT: '8080', // Override
                LOG_LEVEL: 'debug' // Additional
            };

            expect(() => compose(envOverrides)).not.toThrow();
        });

        it('should prioritize envOverrides over process.env', () => {
            process.env.PORT = '3000';
            process.env.DB_ADAPTER = 'json';
            process.env.DATA_DIR = '/default';

            const envOverrides = {
                PORT: '9000',
                DATA_DIR: '/override'
            };

            // Should not throw with overridden values
            expect(() => compose(envOverrides)).not.toThrow();
        });

        it('should throw error for invalid DB_ADAPTER', () => {
            const envOverrides = {
                DB_ADAPTER: 'invalid',
                DATA_DIR: '/test/data',
                PORT: '3000'
            };

            expect(() => compose(envOverrides)).toThrow(
                'DB_ADAPTER must be one of: json, postgres'
            );
        });

        it('should throw error when DATA_DIR missing for JSON adapter', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '',
                PORT: '3000',
                NODE_ENV: 'test'
            };

            expect(() => compose(envOverrides)).toThrow(
                'DATA_DIR is required when using json adapter'
            );
        });

        it('should throw error when Postgres config is incomplete', () => {
            const envOverrides = {
                DB_ADAPTER: 'postgres',
                PORT: '3000',
                NODE_ENV: 'production',
                DATABASE_URL: ''
            };

            expect(() => compose(envOverrides)).toThrow(
                'When using postgres adapter, DATABASE_URL is required'
            );
        });

        it('should throw error for invalid PORT', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '0', // Invalid
                NODE_ENV: 'test'
            };

            expect(() => compose(envOverrides)).toThrow('PORT must be a valid positive number');
        });

        it('should throw error for invalid NODE_ENV', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'invalid'
            };

            expect(() => compose(envOverrides)).toThrow(
                'NODE_ENV must be one of: development, production, test'
            );
        });

        it('should throw error for invalid LOG_LEVEL', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'test',
                LOG_LEVEL: 'invalid'
            };

            expect(() => compose(envOverrides)).toThrow(
                'LOG_LEVEL must be one of: debug, info, warn, error'
            );
        });
    });

    describe('Framework Config Support', () => {
        it('should compose successfully with framework config', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'test'
            };

            const z = require('zod');
            const frameworkConfig = {
                users: {
                    customFields: {
                        customSchema: z.z.object({ bio: z.z.string() })
                    }
                }
            };

            expect(() => compose(envOverrides, frameworkConfig as any)).not.toThrow();
        });

        it('should pass framework config through composition layers', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'test'
            };

            const z = require('zod');
            const frameworkConfig = {
                users: {
                    customFields: {
                        customSchema: z.z.object({ bio: z.z.string() })
                    }
                }
            };

            const result = compose(envOverrides, frameworkConfig as any);

            // Use cases should be created with framework config
            expect(result.useCases).toBeDefined();
        });

        it('should support custom user fields type parameter', () => {
            type CustomUserFields = { bio: string };

            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'test'
            };

            const result = compose<CustomUserFields>(envOverrides);

            // Should compile without errors
            expect(result).toBeDefined();
        });

        it('should support all custom field type parameters', () => {
            type CustomUserFields = { bio: string };
            type CustomOrganizationFields = { description: string };
            type CustomMembershipFields = { role: string };

            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'test'
            };

            const result = compose<
                CustomUserFields,
                CustomOrganizationFields,
                CustomMembershipFields
            >(envOverrides);

            // Should compile without errors
            expect(result).toBeDefined();
        });
    });

    describe('composeForTesting', () => {
        it('should compose with test defaults', () => {
            const result = composeForTesting({ DATA_DIR: '/test/data' });

            expect(result).toHaveProperty('useCases');
        });

        it('should use NODE_ENV=test by default', () => {
            // Should not throw with test defaults
            expect(() => composeForTesting({ DATA_DIR: '/test/data' })).not.toThrow();
        });

        it('should use LOG_LEVEL=error by default', () => {
            // Should not throw with test defaults
            expect(() => composeForTesting({ DATA_DIR: '/test/data' })).not.toThrow();
        });

        it('should allow overriding test defaults', () => {
            const overrides = {
                DATA_DIR: '/custom/test/data',
                NODE_ENV: 'production',
                PORT: 9999
            };

            expect(() => composeForTesting(overrides)).not.toThrow();
        });

        it('should use JSON adapter by default', () => {
            const overrides = {
                DATA_DIR: '/test/data'
            };

            const result = composeForTesting(overrides);

            // Should successfully create useCases with JSON adapter
            expect(result.useCases).toBeDefined();
        });

        it('should allow switching to Postgres adapter in tests', () => {
            const overrides = {
                DB_ADAPTER: 'postgres',
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb'
            };

            expect(() => composeForTesting(overrides)).not.toThrow();
        });

        it('should merge test defaults with provided overrides', () => {
            const overrides = {
                DATA_DIR: '/test/data',
                PORT: 4000 // Override default
                // NODE_ENV and LOG_LEVEL should use test defaults
            };

            expect(() => composeForTesting(overrides)).not.toThrow();
        });
    });

    describe('Integration Tests', () => {
        it('should create fully functional composition for JSON adapter', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/test/data',
                PORT: '3000',
                NODE_ENV: 'test',
                LOG_LEVEL: 'error'
            };

            const { useCases } = compose(envOverrides);

            // Verify all use cases are instantiated
            expect(useCases.users.createUser).toBeDefined();
            expect(useCases.organizations.createOrganization).toBeDefined();
            expect(useCases.memberships.addOrganizationMember).toBeDefined();
        });

        it('should create fully functional composition for Postgres adapter', () => {
            const envOverrides = {
                DB_ADAPTER: 'postgres',
                PORT: '3000',
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb'
            };

            const { useCases } = compose(envOverrides);

            // Verify all use cases are instantiated
            expect(useCases.users.createUser).toBeDefined();
            expect(useCases.organizations.createOrganization).toBeDefined();
            expect(useCases.memberships.addOrganizationMember).toBeDefined();
        });

        it('should handle complete application composition flow', () => {
            const envOverrides = {
                DB_ADAPTER: 'json',
                DATA_DIR: '/env/data',
                PORT: '4000',
                NODE_ENV: 'development',
                LOG_LEVEL: 'debug'
            };

            const z = require('zod');
            const frameworkConfig = {
                users: {
                    customFields: {
                        customSchema: z.z.object({ bio: z.z.string() })
                    }
                }
            };

            const { useCases } = compose(envOverrides, frameworkConfig as any);

            // Complete composition should provide access to all use cases
            expect(useCases.users).toBeDefined();
            expect(useCases.organizations).toBeDefined();
            expect(useCases.memberships).toBeDefined();

            // All individual use cases should be accessible
            expect(Object.keys(useCases.users)).toHaveLength(5); // createUser, getUser, updateUser, listUserOrganizations, deleteUser
            expect(Object.keys(useCases.organizations)).toHaveLength(8); // createOrganization, getOrganization, updateOrganization, listOrganizationMembers, deleteOrganization, archiveOrganization, restoreOrganization, transferOrganizationOwnership
            expect(Object.keys(useCases.memberships)).toHaveLength(5); // addOrganizationMember, removeOrganizationMember, updateOrganizationMemberRole, leaveOrganization, listOrganizationMembers
        });
    });
});
