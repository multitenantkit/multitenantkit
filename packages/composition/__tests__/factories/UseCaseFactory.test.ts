import type { Adapters, ToolkitOptions } from '@multitenantkit/domain-contracts';
import { describe, expect, it } from 'vitest';
import { createUseCases } from '../../src/factories/UseCaseFactory';

// Create minimal mock adapters for testing
function createMockAdapters(): Adapters {
    return {
        uow: {} as any,
        userRepository: {} as any,
        organizationRepository: {} as any,
        organizationMembershipRepository: {} as any,
        clock: { now: () => new Date() } as any,
        uuid: { generate: () => 'test-uuid' } as any
    };
}

describe('UseCaseFactory', () => {
    describe('Use Case Creation', () => {
        it('should create all use cases successfully', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases).toHaveProperty('users');
            expect(useCases).toHaveProperty('organizations');
            expect(useCases).toHaveProperty('memberships');
        });

        it('should create user use cases', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.users).toHaveProperty('createUser');
            expect(useCases.users).toHaveProperty('getUser');
            expect(useCases.users).toHaveProperty('updateUser');
            expect(useCases.users).toHaveProperty('listUserOrganizations');
        });

        it('should create organization use cases', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.organizations).toHaveProperty('createOrganization');
            expect(useCases.organizations).toHaveProperty('getOrganization');
            expect(useCases.organizations).toHaveProperty('updateOrganization');
            expect(useCases.organizations).toHaveProperty('listOrganizationMembers');
        });

        it('should create membership use cases', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.memberships).toHaveProperty('addOrganizationMember');
            expect(useCases.memberships).toHaveProperty('removeOrganizationMember');
            expect(useCases.memberships).toHaveProperty('updateOrganizationMemberRole');
            expect(useCases.memberships).toHaveProperty('leaveOrganization');
        });
    });

    describe('Toolkit Options Support', () => {
        it('should create use cases without toolkit options', () => {
            const adapters = createMockAdapters();

            expect(() => createUseCases(adapters)).not.toThrow();
        });

        it('should create use cases with toolkit options', () => {
            const adapters = createMockAdapters();
            const z = require('zod');
            const toolkitOptions: ToolkitOptions<{ bio: string }> = {
                users: {
                    customFields: {
                        customSchema: z.object({ bio: z.string() })
                    }
                }
            };

            expect(() => createUseCases(adapters, toolkitOptions)).not.toThrow();
        });

        it('should pass toolkit options to user use cases', () => {
            const adapters = createMockAdapters();
            const z = require('zod');
            const toolkitOptions: ToolkitOptions<{ bio: string }> = {
                users: {
                    customFields: {
                        customSchema: z.object({ bio: z.string() })
                    }
                }
            };

            const useCases = createUseCases(adapters, toolkitOptions);

            // Use cases should be created without errors
            expect(useCases.users).toBeDefined();
            expect(useCases.users.createUser).toBeDefined();
            expect(useCases.users.getUser).toBeDefined();
            expect(useCases.users.updateUser).toBeDefined();
            expect(useCases.users.listUserOrganizations).toBeDefined();
        });

        it('should pass toolkit options to organization use cases', () => {
            const adapters = createMockAdapters();
            const z = require('zod');
            // biome-ignore lint/complexity/noBannedTypes: ignore
            const toolkitOptions: ToolkitOptions<{}, { description: string }> = {
                organizations: {
                    customFields: {
                        customSchema: z.object({ description: z.string() })
                    }
                }
            };

            const useCases = createUseCases(adapters, toolkitOptions);

            // Use cases should be created without errors
            expect(useCases.organizations).toBeDefined();
            expect(useCases.organizations.createOrganization).toBeDefined();
            expect(useCases.organizations.getOrganization).toBeDefined();
            expect(useCases.organizations.updateOrganization).toBeDefined();
            expect(useCases.organizations.listOrganizationMembers).toBeDefined();
        });

        it('should pass toolkit options to membership use cases', () => {
            const adapters = createMockAdapters();
            const toolkitOptions: ToolkitOptions = {
                // No specific config needed
            };

            const useCases = createUseCases(adapters, toolkitOptions);

            // Use cases should be created without errors
            expect(useCases.memberships).toBeDefined();
            expect(useCases.memberships.addOrganizationMember).toBeDefined();
            expect(useCases.memberships.removeOrganizationMember).toBeDefined();
            expect(useCases.memberships.updateOrganizationMemberRole).toBeDefined();
            expect(useCases.memberships.leaveOrganization).toBeDefined();
        });
    });

    describe('Use Case Types', () => {
        it('should create CreateUser instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.users.createUser.constructor.name).toBe('CreateUser');
        });

        it('should create GetUser instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.users.getUser.constructor.name).toBe('GetUser');
        });

        it('should create UpdateUser instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.users.updateUser.constructor.name).toBe('UpdateUser');
        });

        it('should create ListUserOrganizations instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.users.listUserOrganizations.constructor.name).toBe(
                'ListUserOrganizations'
            );
        });

        it('should create CreateOrganization instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.organizations.createOrganization.constructor.name).toBe(
                'CreateOrganization'
            );
        });

        it('should create GetOrganization instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.organizations.getOrganization.constructor.name).toBe('GetOrganization');
        });

        it('should create UpdateOrganization instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.organizations.updateOrganization.constructor.name).toBe(
                'UpdateOrganization'
            );
        });

        it('should create ListOrganizationMembers instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.organizations.listOrganizationMembers.constructor.name).toBe(
                'ListOrganizationMembers'
            );
        });

        it('should create AddOrganizationMember instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.memberships.addOrganizationMember.constructor.name).toBe(
                'AddOrganizationMember'
            );
        });

        it('should create RemoveOrganizationMember instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.memberships.removeOrganizationMember.constructor.name).toBe(
                'RemoveOrganizationMember'
            );
        });

        it('should create UpdateOrganizationMemberRole instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.memberships.updateOrganizationMemberRole.constructor.name).toBe(
                'UpdateOrganizationMemberRole'
            );
        });

        it('should create LeaveOrganization instance', () => {
            const adapters = createMockAdapters();
            const useCases = createUseCases(adapters);

            expect(useCases.memberships.leaveOrganization.constructor.name).toBe(
                'LeaveOrganization'
            );
        });
    });

    describe('Generic Type Support', () => {
        it('should support custom user fields type parameter', () => {
            type CustomUserFields = { bio: string };
            const adapters = createMockAdapters() as Adapters<CustomUserFields>;

            const useCases = createUseCases<CustomUserFields>(adapters);

            // Should compile without errors
            expect(useCases).toBeDefined();
        });

        it('should support custom organization fields type parameter', () => {
            type CustomOrganizationFields = { description: string };
            // biome-ignore lint/complexity/noBannedTypes: ignore
            const adapters = createMockAdapters() as Adapters<{}, CustomOrganizationFields>;

            // biome-ignore lint/complexity/noBannedTypes: ignore
            const useCases = createUseCases<{}, CustomOrganizationFields>(adapters);

            // Should compile without errors
            expect(useCases).toBeDefined();
        });

        it('should support all custom field type parameters', () => {
            type CustomUserFields = { bio: string };
            type CustomOrganizationFields = { description: string };
            type CustomMembershipFields = { role: string };
            const adapters = createMockAdapters() as Adapters<
                CustomUserFields,
                CustomOrganizationFields,
                CustomMembershipFields
            >;

            const useCases = createUseCases<
                CustomUserFields,
                CustomOrganizationFields,
                CustomMembershipFields
            >(adapters);

            // Should compile without errors
            expect(useCases).toBeDefined();
        });
    });
});
