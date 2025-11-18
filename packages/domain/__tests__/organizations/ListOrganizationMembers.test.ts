import type { Adapters } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListOrganizationMembers } from '../../src/organizations/use-cases/list-organization-members/ListOrganizationMembers';
import { createTestSetup } from '../test-helpers/TestUtils';

function createOrganization(params: Partial<{ id: string; ownerUserId: string }>): any {
    return {
        id: params.id ?? '90000000-0000-4000-8000-000000000000',
        ownerUserId: params.ownerUserId ?? '00000000-0000-4000-8000-00000000D000',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        deletedAt: undefined
    };
}

describe('ListOrganizationMembers use case', () => {
    let setup: ReturnType<typeof createTestSetup>;
    let adapters: Adapters;

    beforeEach(() => {
        setup = createTestSetup();
        adapters = {
            persistence: {
                uow: setup.uow as any,
                userRepository: setup.userRepo as any,
                organizationRepository: setup.uow.getOrganizationRepository() as any,
                organizationMembershipRepository:
                    setup.uow.getOrganizationMembershipRepository() as any
            },
            system: {
                clock: setup.clock,
                uuid: setup.uuid
            }
        };
    });

    describe('Happy Path', () => {
        it('should list members for owner', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000D001';
            const organization = createOrganization({
                id: '90000000-0000-4000-8000-000000001001',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });

            // Add two memberships (one active, one left)
            const membershipRepo = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.addMembership({
                id: '91000000-0000-4000-8000-000000001000',
                organizationId: organization.id,
                userId: '00000000-0000-4000-8000-00000000D101',
                username: '00000000-0000-4000-8000-00000000D101',
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            } as any);
            membershipRepo.addMembership({
                id: '91000000-0000-4000-8000-000000001001',
                organizationId: organization.id,
                userId: '00000000-0000-4000-8000-00000000D102',
                username: '00000000-0000-4000-8000-00000000D102',
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            } as any);

            // Add mock users and organization for findByOrganizationWithUserInfo
            membershipRepo.addMockUser({
                id: '00000000-0000-4000-8000-00000000D101',
                externalId: 'user101',
                username: 'user101',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });
            membershipRepo.addMockUser({
                id: '00000000-0000-4000-8000-00000000D102',
                externalId: 'user102',
                username: 'user102',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });
            membershipRepo.addMockOrganization(organization);

            const useCase = new ListOrganizationMembers(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    principalExternalId,
                    options: { page: 1, pageSize: 20 }
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);
            const paginatedResult = result.getValue();
            expect(paginatedResult.items.length).toBe(1);
            expect(paginatedResult.items[0]?.user?.id).toBe('00000000-0000-4000-8000-00000000D101');
        });

        it('should list members for active member (not owner)', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000D011';
            const memberId = '00000000-0000-4000-8000-00000000D012';
            const organization = createOrganization({
                id: '90000000-0000-4000-8000-000000001011',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });

            // Add membership for the actor (active)
            const membershipRepo = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.addMembership({
                id: '91000000-0000-4000-8000-000000001100',
                organizationId: organization.id,
                userId: memberId,
                username: 'member012',
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            } as any);

            // Add mock user and organization
            membershipRepo.addMockUser({
                id: memberId,
                externalId: 'member012',
                username: 'member012',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });
            membershipRepo.addMockOrganization(organization);

            const useCase = new ListOrganizationMembers(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    principalExternalId,
                    options: { page: 1, pageSize: 20 }
                },
                { requestId: 'test-request-id', actorUserId: memberId }
            );

            expect(result.isSuccess).toBe(true);
            const paginatedResult = result.getValue();
            expect(paginatedResult.items.length).toBe(1);
        });

        it('should list only active members when includeActive is set', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000D002';
            const organization = createOrganization({
                id: '90000000-0000-4000-8000-000000001002',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });
            const membershipRepo = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.addMembership({
                id: '91000000-0000-4000-8000-000000001010',
                organizationId: organization.id,
                userId: '00000000-0000-4000-8000-00000000D201',
                username: '00000000-0000-4000-8000-00000000D201',
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            } as any);
            membershipRepo.addMembership({
                id: '91000000-0000-4000-8000-000000001011',
                organizationId: organization.id,
                userId: '00000000-0000-4000-8000-00000000D202',
                username: '00000000-0000-4000-8000-00000000D202',
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            } as any);

            // Add mock users and organization
            membershipRepo.addMockUser({
                id: '00000000-0000-4000-8000-00000000D201',
                externalId: 'user201',
                username: 'user201',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });
            membershipRepo.addMockUser({
                id: '00000000-0000-4000-8000-00000000D202',
                externalId: 'user202',
                username: 'user202',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });
            membershipRepo.addMockOrganization(organization);

            const useCase = new ListOrganizationMembers(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    principalExternalId,
                    options: {
                        includeActive: true,
                        includePending: false,
                        includeRemoved: false,
                        page: 1,
                        pageSize: 20
                    }
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);
            const paginatedResult = result.getValue();
            // TODO: update test when pagination is implemented
            expect(paginatedResult.items.length).toBe(1);
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when organization does not exist', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-00000000D005';
            const useCase = new ListOrganizationMembers(adapters);
            const result = await useCase.execute(
                {
                    organizationId: '90000000-0000-4000-8000-000000009999',
                    principalExternalId,
                    options: { page: 1, pageSize: 20 }
                },
                { requestId: 'test-request-id', actorUserId: userId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });
    });

    describe('Error Cases - Authorization', () => {
        it('should fail with UNAUTHORIZED for non-owner non-member', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000D003';
            const outsiderId = '00000000-0000-4000-8000-00000000D004';
            const organization = createOrganization({
                id: '90000000-0000-4000-8000-000000001003',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            await setup.uow.getUserRepository().insert({
                id: outsiderId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });

            const useCase = new ListOrganizationMembers(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    principalExternalId,
                    options: { page: 1, pageSize: 20 }
                },
                { requestId: 'test-request-id', actorUserId: principalExternalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap repository errors as VALIDATION_ERROR', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000D006';
            const organization = createOrganization({
                id: '90000000-0000-4000-8000-000000001004',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });

            // Make repository throw during listing
            const membershipRepo: any = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.findByOrganizationWithUserInfo = async () => {
                throw new Error('repo error');
            };

            const useCase = new ListOrganizationMembers(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    principalExternalId,
                    options: { page: 1, pageSize: 20 }
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Custom Fields Support', () => {
        it('should support custom fields in user, organization, and membership schemas', async () => {
            const { z } = await import('zod');

            // Define custom field schemas
            const customUserFieldsSchema = z.object({
                firstName: z.string().min(1).max(100),
                lastName: z.string().min(1).max(100),
                email: z.string().email()
            });

            const customOrganizationFieldsSchema = z.object({
                name: z.string().min(1).max(100),
                description: z.string().nullable()
            });

            const customMembershipFieldsSchema = z.object({
                invitedBy: z.string().optional()
            });

            // Create toolkit options with custom schemas
            const toolkitOptions = {
                users: { customFields: { customSchema: customUserFieldsSchema } },
                organizations: { customFields: { customSchema: customOrganizationFieldsSchema } },
                organizationMemberships: {
                    customFields: { customSchema: customMembershipFieldsSchema }
                }
            };

            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000D100';
            const organization = createOrganization({
                id: '90000000-0000-4000-8000-000000001100',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });

            // Add membership with custom fields
            const membershipRepo = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.addMembership({
                id: '91000000-0000-4000-8000-000000001200',
                organizationId: organization.id,
                userId: '00000000-0000-4000-8000-00000000D201',
                username: '00000000-0000-4000-8000-00000000D201',
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                invitedBy: ownerId // Custom field
            } as any);

            // Add mock user with custom fields
            membershipRepo.addMockUser({
                id: '00000000-0000-4000-8000-00000000D201',
                externalId: 'user201',
                username: 'user201',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined,
                firstName: 'John', // Custom field
                lastName: 'Doe', // Custom field
                email: 'john.doe@example.com' // Custom field
            } as any);

            // Add mock organization with custom fields
            membershipRepo.addMockOrganization({
                ...organization,
                name: 'Engineering Organization', // Custom field
                description: 'Core engineering organization' // Custom field
            });

            // Instantiate use case with custom field types
            const useCase = new ListOrganizationMembers<
                typeof customUserFieldsSchema,
                typeof customOrganizationFieldsSchema,
                typeof customMembershipFieldsSchema
            >(adapters as any, toolkitOptions as any);

            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    principalExternalId,
                    options: { page: 1, pageSize: 20 }
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);
            const paginatedResult = result.getValue();
            expect(paginatedResult.items.length).toBe(1);
            expect(paginatedResult.pagination.total).toBe(1);
            expect(paginatedResult.pagination.page).toBe(1);

            // Verify custom fields are present and accessible with type safety
            const member = paginatedResult.items[0];

            // User custom fields
            expect(member.user?.firstName).toBe('John');
            expect(member.user?.lastName).toBe('Doe');
            expect(member.user?.email).toBe('john.doe@example.com');

            // Organization custom fields
            expect(member.organization?.name).toBe('Engineering Organization');
            expect(member.organization.description).toBe('Core engineering organization');

            // Membership custom fields
            expect(member.invitedBy).toBe(ownerId);
        });

        it('should validate custom fields with Zod schema at runtime', async () => {
            const { z } = await import('zod');

            const customUserFieldsSchema = z.object({
                firstName: z.string().min(1),
                email: z.string().email()
            });

            const toolkitOptions = {
                users: { customFields: { customSchema: customUserFieldsSchema } }
            };

            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000D110';
            const organization = createOrganization({
                id: '90000000-0000-4000-8000-000000001110',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });

            const membershipRepo = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.addMembership({
                id: '91000000-0000-4000-8000-000000001210',
                organizationId: organization.id,
                userId: '00000000-0000-4000-8000-00000000D211',
                username: '00000000-0000-4000-8000-00000000D211',
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            } as any);

            membershipRepo.addMockUser({
                id: '00000000-0000-4000-8000-00000000D211',
                externalId: 'user211',
                username: 'user211',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined,
                firstName: 'Jane',
                email: 'jane@example.com'
            } as any);
            membershipRepo.addMockOrganization(organization);

            const useCase = new ListOrganizationMembers<typeof customUserFieldsSchema>(
                adapters as any,
                toolkitOptions as any
            );

            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    principalExternalId,
                    options: { page: 1, pageSize: 20 }
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);

            // TypeScript should recognize custom fields statically
            const paginatedResult = result.getValue();
            const firstMember = paginatedResult.items[0];

            // These should be accessible without ts-ignore
            expect(firstMember.user?.firstName).toBe('Jane');
            expect(firstMember.user?.email).toBe('jane@example.com');
        });
    });
});
