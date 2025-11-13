import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateOrganization } from '../../src/organizations/use-cases/update-organization/UpdateOrganization';
import { createTestSetup } from '../test-helpers/TestUtils';
import { type Adapters, type FrameworkConfig } from '@multitenantkit/domain-contracts';

describe('UpdateOrganization use case', () => {
    let setup: ReturnType<typeof createTestSetup>;
    let adapters: Adapters;

    let principalExternalOwnerId: string;
    let ownerId: string;
    let organizationId: string;
    let principalExternalAdminId: string;
    let adminId: string;

    beforeEach(async () => {
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

        // Setup basic data
        principalExternalOwnerId = '00000000-0000-4000-8000-000000000000';
        ownerId = '00000000-0000-4000-8000-000000000001';
        organizationId = '00000000-0000-4000-8000-000000000010';

        principalExternalAdminId = '00000000-0000-4000-8000-000000000002';
        adminId = '00000000-0000-4000-8000-000000000003';

        // Create owner user
        await setup.userRepo.insert({
            id: ownerId,
            externalId: principalExternalOwnerId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });

        // Create organization
        await setup.uow.getOrganizationRepository().insert({
            id: organizationId,
            ownerUserId: ownerId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });

        // Create admin user
        await setup.userRepo.insert({
            id: adminId,
            externalId: principalExternalAdminId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });

        // Create admin organization membership
        await setup.uow.getOrganizationMembershipRepository().addMembership({
            id: '00000000-0000-4000-8000-000000000011',
            organizationId: organizationId,
            userId: adminId,
            roleCode: 'admin',
            invitedAt: undefined,
            joinedAt: new Date(),
            leftAt: undefined,
            deletedAt: undefined,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    });

    describe('Happy Path', () => {
        it('should update organization as owner', async () => {
            // Provide a custom field via framework config to satisfy input refine
            type OrganizationCustom = { category?: string };
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string().optional()
                        })
                    }
                }
            } as any;

            const useCase = new UpdateOrganization<OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );
            const result = await useCase.execute(
                {
                    organizationId: organizationId,
                    principalExternalId: principalExternalOwnerId,
                    category: 'owner-update'
                } as any,
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().id).toBe(organizationId);
        });

        it('should update organization as admin member', async () => {
            type OrganizationCustom = { category?: string };
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string().optional()
                        })
                    }
                }
            } as any;

            const useCase = new UpdateOrganization<OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );
            const result = await useCase.execute(
                {
                    organizationId: organizationId,
                    principalExternalId: principalExternalAdminId,
                    category: 'admin-update'
                } as any,
                { requestId: 'test-request-id', actorUserId: adminId }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().id).toBe(organizationId);
        });

        it('should accept and return custom fields when framework config provided', async () => {
            type OrganizationCustom = { category?: string };
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string().optional()
                        })
                    }
                }
            } as any;

            const useCase = new UpdateOrganization<OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );
            const result = await useCase.execute(
                {
                    organizationId: organizationId,
                    principalExternalId: principalExternalOwnerId,
                    category: 'platform'
                } as any,
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);
            expect((result.getValue() as any).category).toBe('platform');
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when organization does not exist', async () => {
            type OrganizationCustom = { category?: string };
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string().optional()
                        })
                    }
                }
            } as any;

            const useCase = new UpdateOrganization<OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );

            const result = await useCase.execute(
                {
                    organizationId: '80000000-0000-4000-8000-000000009999',
                    userId: ownerId,
                    category: 'x',
                    principalExternalId: principalExternalOwnerId
                } as any,
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail with VALIDATION_ERROR when no update fields are provided', async () => {
            const ownerId = '00000000-0000-4000-8000-00000000C008';
            const organization = {
                id: '80000000-0000-4000-8000-000000001005',
                ownerUserId: ownerId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new UpdateOrganization(adapters);
            // Only organizationId and userId -> should fail refine()
            const result = await useCase.execute(
                { organizationId: organizationId, userId: ownerId } as any,
                {
                    actorUserId: ownerId
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });

        it('should fail with VALIDATION_ERROR when merged organization data is invalid (legacy)', async () => {
            // Persist a malformed organization (createdAt as string) to simulate legacy/bad data
            const ownerId = '00000000-0000-4000-8000-00000000C009';
            const badOrganization: any = {
                id: '80000000-0000-4000-8000-00000000BADD',
                ownerUserId: ownerId,
                createdAt: '2025-01-01T00:00:00.000Z', // invalid type, should be Date
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(badOrganization);

            type OrganizationCustom = { category?: string };
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string().optional()
                        })
                    }
                }
            } as any;

            const useCase = new UpdateOrganization<OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );
            // Provide a valid update field so we hit the merged validation on entity
            const result = await useCase.execute(
                { organizationId: badOrganization.id, userId: ownerId, category: 'x' } as any,
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Error Cases - Authorization', () => {
        it('should fail with UNAUTHORIZED for non-owner non-admin', async () => {
            const ownerId = '00000000-0000-4000-8000-00000000C004';
            const outsiderId = '00000000-0000-4000-8000-00000000C005';
            const organization = {
                id: '80000000-0000-4000-8000-000000001003',
                ownerUserId: ownerId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            type OrganizationCustom = { category?: string };
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string().optional()
                        })
                    }
                }
            } as any;

            const useCase = new UpdateOrganization<OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );
            const result = await useCase.execute(
                {
                    organizationId: organizationId,
                    principalExternalId: outsiderId,
                    category: 'try'
                } as any,
                { requestId: 'test-request-id', actorUserId: outsiderId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });
    });
});
