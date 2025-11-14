import type { Adapters, FrameworkConfig } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListUserOrganizations } from '../../src/users/use-cases/list-user-organizations/ListUserOrganizations';
import { TestData } from '../test-helpers/Builders';
import { createTestSetup } from '../test-helpers/TestUtils';

// Minimal Organization builder matching OrganizationProps from contracts
function createOrganization(
    params: Partial<{ id: string; ownerUserId: string; deletedAt?: Date | null }>
): any {
    return {
        id: params.id ?? '10000000-0000-4000-8000-000000000000',
        ownerUserId: params.ownerUserId ?? '00000000-0000-4000-8000-000000000000',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        deletedAt: params.deletedAt ?? undefined
    };
}

describe('ListUserOrganizations use case', () => {
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
        it('should list organizations where user is member or owner', async () => {
            const user = TestData.user()
                .withId('00000000-0000-4000-8000-000000000100')
                .withExternalId('00000000-0000-4000-8000-000000000200') // Auth provider ID
                .build();
            await setup.userRepo.insert(user);

            // Create organizations
            const organizationA = createOrganization({
                id: '20000000-0000-4000-8000-000000000001'
            });
            const organizationB = createOrganization({
                id: '20000000-0000-4000-8000-000000000002'
            });
            const ownedOrganization = createOrganization({
                id: '20000000-0000-4000-8000-000000000003',
                ownerUserId: user.id
            });
            await setup.uow.getOrganizationRepository().insert(organizationA);
            await setup.uow.getOrganizationRepository().insert(organizationB);
            await setup.uow.getOrganizationRepository().insert(ownedOrganization);

            // Add memberships for organizationA and organizationB
            const membershipRepo = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.addMembership({
                id: '30000000-0000-4000-8000-000000000001',
                userId: user.id,
                username: user.externalId,
                organizationId: organizationA.id,
                roleCode: 'member',
                joinedAt: new Date('2025-01-02T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-02T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z')
            });
            membershipRepo.addMembership({
                id: '30000000-0000-4000-8000-000000000002',
                userId: user.id,
                username: user.externalId,
                organizationId: organizationB.id,
                roleCode: 'admin',
                joinedAt: new Date('2025-01-02T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-02T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z')
            });

            const useCase = new ListUserOrganizations(adapters);
            // userId in input is actually externalId (auth provider ID)
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', actorUserId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            const organizations = result.getValue() as any[];
            const ids = organizations.map((t: any) => t.id).sort();
            expect(ids).toEqual([organizationA.id, organizationB.id, ownedOrganization.id].sort());
        });

        it('should support custom organization fields via framework config', async () => {
            type OrganizationCustom = { category: string };
            // biome-ignore lint/complexity/noBannedTypes: ignore
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const user = TestData.user()
                .withId('00000000-0000-4000-8000-000000000300')
                .withExternalId('00000000-0000-4000-8000-000000000400')
                .build();
            await setup.userRepo.insert(user);

            const organizationC = {
                ...createOrganization({ id: '20000000-0000-4000-8000-000000000010' }),
                category: 'engineering'
            } as any;
            await setup.uow.getOrganizationRepository().insert(organizationC);
            setup.uow.getOrganizationMembershipRepository().addMembership({
                id: '30000000-0000-4000-8000-000000000010',
                userId: user.id,
                username: user.externalId,
                organizationId: organizationC.id,
                roleCode: 'member',
                joinedAt: new Date('2025-01-02T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-02T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z')
            });

            // biome-ignore lint/complexity/noBannedTypes: ignore
            const useCase = new ListUserOrganizations<{}, OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', actorUserId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            const organizations = result.getValue() as any[];
            expect(organizations[0].category).toBe('engineering');
        });

        it('should list organizations with custom fields for both memberships and owned organizations', async () => {
            const user = TestData.user()
                .withId('00000000-0000-4000-8000-000000000100')
                .withExternalId('00000000-0000-4000-8000-000000000500')
                .build();
            await setup.userRepo.insert(user);

            type OrganizationCustom = { category: string };
            const frameworkConfig = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string()
                        })
                    }
                }
            } as any;

            // Create organizations with custom fields
            const organizationA = {
                ...createOrganization({ id: '20000000-0000-4000-8000-000000000001' }),
                category: 'a'
            } as any;
            const organizationB = {
                ...createOrganization({ id: '20000000-0000-4000-8000-000000000002' }),
                category: 'b'
            } as any;
            const ownedOrganization = {
                ...createOrganization({
                    id: '20000000-0000-4000-8000-000000000003',
                    ownerUserId: user.id
                }),
                category: 'owner'
            } as any;
            await setup.uow.getOrganizationRepository().insert(organizationA);
            await setup.uow.getOrganizationRepository().insert(organizationB);
            await setup.uow.getOrganizationRepository().insert(ownedOrganization);

            // Add memberships for organizationA and organizationB
            const membershipRepo = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.addMembership({
                id: '30000000-0000-4000-8000-000000000001',
                userId: user.id,
                username: user.externalId,
                organizationId: organizationA.id,
                roleCode: 'member',
                joinedAt: new Date('2025-01-02T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-02T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z')
            });
            membershipRepo.addMembership({
                id: '30000000-0000-4000-8000-000000000002',
                userId: user.id,
                username: user.externalId,
                organizationId: organizationB.id,
                roleCode: 'admin',
                joinedAt: new Date('2025-01-02T00:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-02T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z')
            });

            // biome-ignore lint/complexity/noBannedTypes: ignore
            const useCase = new ListUserOrganizations<{}, OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', actorUserId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            const organizations = result.getValue() as any[];
            const ids = organizations.map((t: any) => t.id).sort();
            expect(ids).toEqual([organizationA.id, organizationB.id, ownedOrganization.id].sort());

            // Validate custom fields are present
            const byId: Record<string, any> = Object.fromEntries(
                organizations.map((t) => [t.id, t])
            );
            expect(byId[organizationA.id].category).toBe('a');
            expect(byId[organizationB.id].category).toBe('b');
            expect(byId[ownedOrganization.id].category).toBe('owner');
        });
    });

    describe('Edge Cases', () => {
        it('should return empty array when no memberships or owned organizations', async () => {
            const user = TestData.user()
                .withId('00000000-0000-4000-8000-000000000200')
                .withExternalId('00000000-0000-4000-8000-000000000600')
                .build();
            await setup.userRepo.insert(user);

            const useCase = new ListUserOrganizations(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', actorUserId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([]);
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when user does not exist', async () => {
            const useCase = new ListUserOrganizations(adapters);
            // Pass an externalId that doesn't exist in the system
            const nonExistentExternalId = '11111111-1111-4111-8111-111111111111';
            const result = await useCase.execute(
                { principalExternalId: nonExistentExternalId }, // userId is actually externalId
                {
                    requestId: 'test-request-id',
                    actorUserId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            const error = result.getError();
            expect(error.code).toBe('NOT_FOUND');
            expect(error.message).toContain(
                `User with identifier '${nonExistentExternalId}' not found`
            );
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap repository errors as VALIDATION_ERROR', async () => {
            const user = TestData.user()
                .withId('00000000-0000-4000-8000-000000000400')
                .withExternalId('00000000-0000-4000-8000-000000000700')
                .build();
            await setup.userRepo.insert(user);

            // Force membership repository to throw so try/catch path is exercised
            const membershipRepo: any = setup.uow.getOrganizationMembershipRepository();
            membershipRepo.findByUser = async () => {
                throw new Error('repo error');
            };

            const useCase = new ListUserOrganizations(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', actorUserId: user.externalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });
});
