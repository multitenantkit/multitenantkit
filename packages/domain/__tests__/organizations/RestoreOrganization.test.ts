import { describe, it, expect, beforeEach } from 'vitest';
import { RestoreOrganization } from '../../src/organizations/use-cases/restore-organization/RestoreOrganization';
import { TestData } from '../test-helpers/Builders';
import { createTestSetup } from '../test-helpers/TestUtils';
import { type Adapters } from '@multitenantkit/domain-contracts';

describe('RestoreOrganization use case', () => {
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
        it('should restore archived organization successfully', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const archivedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: archivedDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.id).toBe(organization.id);
            expect(out.archivedAt).toBeUndefined();
            expect(out.updatedAt).toBeInstanceOf(Date);

            // Verify organization is no longer marked as archived in repository
            const fromRepo = await setup.uow.getOrganizationRepository().findById(organization.id);
            expect(fromRepo).toBeDefined();
            expect(fromRepo?.archivedAt).toBeUndefined();
        });

        it('should update updatedAt timestamp when restoring', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const oldDate = new Date('2025-01-01T10:00:00.000Z');
            const archivedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: oldDate,
                updatedAt: oldDate,
                archivedAt: archivedDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Set clock to a different time
            const newDate = new Date('2025-02-01T10:00:00.000Z');
            setup.clock.setTime(newDate);

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.updatedAt).toEqual(newDate);
            expect(out.archivedAt).toBeUndefined();
        });

        it('should preserve organization data when restoring', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const organizationId = '00000000-0000-4000-8000-000000000123';
            const archivedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: organizationId,
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: archivedDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.id).toBe(organizationId);
            expect(out.ownerUserId).toBe(owner.id);
            expect(out.createdAt).toEqual(organization.createdAt);
        });

        it('should NOT modify memberships when restoring organization (active memberships become active automatically)', async () => {
            const owner = TestData.user().build();
            const member1 = TestData.user().withId('00000000-0000-4000-8000-000000000002').build();
            const member2 = TestData.user().withId('00000000-0000-4000-8000-000000000003').build();
            const member3 = TestData.user().withId('00000000-0000-4000-8000-000000000004').build();

            await setup.userRepo.insert(owner);
            await setup.userRepo.insert(member1);
            await setup.userRepo.insert(member2);
            await setup.userRepo.insert(member3);

            // Create an archived organization
            const archivedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: archivedDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Create memberships in different states:
            // - Active membership (should remain active when organization is restored)
            const activeMembership = {
                id: setup.uuid.generate(),
                userId: member1.id,
                organizationId: organization.id,
                roleCode: 'member' as const,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined, // Active when organization was archived
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // - Left membership (should remain as historical record)
            const leftMembership = {
                id: setup.uuid.generate(),
                userId: member2.id,
                organizationId: organization.id,
                roleCode: 'admin' as const,
                joinedAt: new Date(),
                leftAt: new Date('2025-01-10'), // User left before organization archival
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // - Explicitly deleted membership (should remain deleted)
            const deletedMembership = {
                id: setup.uuid.generate(),
                userId: member3.id,
                organizationId: organization.id,
                roleCode: 'member' as const,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: new Date('2025-01-12'), // Explicitly removed before organization archival
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(activeMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(leftMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(deletedMembership);

            // Restore the organization
            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isSuccess).toBe(true);

            // Verify memberships are NOT modified - they retain their original state
            const organizationMemberships = await setup.uow
                .getOrganizationMembershipRepository()
                .findByOrganization(organization.id, false);
            expect(organizationMemberships.length).toBe(3);

            // Active membership should remain active (will be active when queried with organization)
            const restored1 = organizationMemberships.find((m) => m.userId === member1.id);
            expect(restored1?.deletedAt).toBeUndefined();
            expect(restored1?.leftAt).toBeUndefined();

            // Left membership should preserve its leftAt
            const restored2 = organizationMemberships.find((m) => m.userId === member2.id);
            expect(restored2?.deletedAt).toBeUndefined();
            expect(restored2?.leftAt).toBeInstanceOf(Date);

            // Deleted membership should remain deleted
            const restored3 = organizationMemberships.find((m) => m.userId === member3.id);
            expect(restored3?.deletedAt).toBeInstanceOf(Date);
        });

        it('should handle organization with no memberships', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const archivedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: archivedDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().archivedAt).toBeUndefined();
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when organization does not exist', async () => {
            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: '11111111-1111-4111-8111-111111111111' },
                {
                    requestId: 'test-request-id',
                    actorUserId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail with VALIDATION_ERROR when organization is not archived', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined, // Organization is active (not archived)
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('not archived');
        });

        it('should fail with VALIDATION_ERROR when organization is deleted (deleted organizations cannot be restored)', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const archivedDate = new Date('2025-01-10T10:00:00.000Z');
            const deletedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: archivedDate, // Organization was archived
                deletedAt: deletedDate // Then deleted - cannot be restored
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('Deleted organizations cannot be restored');
        });

        it('should fail with VALIDATION_ERROR when actor is not the owner', async () => {
            const owner = TestData.user().build();
            const otherUser = TestData.user()
                .withId('00000000-0000-4000-8000-000000000099')

                .build();

            await setup.userRepo.insert(owner);
            await setup.userRepo.insert(otherUser);

            const archivedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: archivedDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: otherUser.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('owner');
        });

        it('should fail with VALIDATION_ERROR when owner user is deleted', async () => {
            const deletedOwner = TestData.user().withDeletedAt(new Date('2025-01-10')).build();
            await setup.userRepo.insert(deletedOwner);

            const archivedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: deletedOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: archivedDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: deletedOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('owner user is deleted');
        });

        it('should fail with VALIDATION_ERROR when organizationId is invalid format', async () => {
            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute({ organizationId: 'not-a-valid-uuid' } as any, {
                requestId: 'test-request-id',
                actorUserId: '00000000-0000-4000-8000-000000000000'
            });

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const archivedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: archivedDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Force UoW to throw during transaction
            (setup.uow as any).setTransactionError(new Error('tx failure'));

            const useCase = new RestoreOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });
});
