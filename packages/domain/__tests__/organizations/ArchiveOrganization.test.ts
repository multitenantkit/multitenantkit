import type { Adapters } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { ArchiveOrganization } from '../../src/organizations/use-cases/archive-organization/ArchiveOrganization';
import { TestData } from '../test-helpers/Builders';
import { createTestSetup } from '../test-helpers/TestUtils';

describe('ArchiveOrganization use case', () => {
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
        it('should archive organization successfully when called by owner', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: owner.externalId },
                { requestId: 'test-request-id', externalId: owner.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.id).toBe(organization.id);
            expect(out.archivedAt).toBeInstanceOf(Date);
            expect(out.updatedAt).toBeInstanceOf(Date);

            // Verify organization is marked as archived in repository
            const fromRepo = await setup.uow.getOrganizationRepository().findById(organization.id);
            expect(fromRepo).toBeDefined();
            expect(fromRepo?.archivedAt).toBeInstanceOf(Date);
        });

        it('should archive organization successfully when called by admin', async () => {
            const owner = TestData.user().build();
            const admin = TestData.user().withId('00000000-0000-4000-8000-000000000002').build();
            await setup.userRepo.insert(owner);
            await setup.userRepo.insert(admin);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Create admin membership
            const adminMembership = {
                id: setup.uuid.generate(),
                userId: admin.id,
                username: admin.username,
                organizationId: organization.id,
                roleCode: 'admin' as const,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(adminMembership);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: admin.externalId },
                { requestId: 'test-request-id', externalId: admin.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.archivedAt).toBeInstanceOf(Date);
        });

        it('should update updatedAt timestamp when archiving', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const oldDate = new Date('2025-01-01T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: oldDate,
                updatedAt: oldDate,
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Set clock to a different time
            const newDate = new Date('2025-02-01T10:00:00.000Z');
            setup.clock.setTime(newDate);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: owner.externalId },
                { requestId: 'test-request-id', externalId: owner.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.updatedAt).toEqual(newDate);
            expect(out.archivedAt).toEqual(newDate);
        });

        it('should preserve organization data when archiving', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const organizationId = '00000000-0000-4000-8000-000000000123';
            const organization = {
                id: organizationId,
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: owner.externalId },
                { requestId: 'test-request-id', externalId: owner.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.id).toBe(organizationId);
            expect(out.ownerUserId).toBe(owner.id);
            expect(out.createdAt).toEqual(organization.createdAt);
        });

        it('should NOT modify memberships when archiving organization', async () => {
            const owner = TestData.user().build();
            const member1 = TestData.user().withId('00000000-0000-4000-8000-000000000002').build();
            const member2 = TestData.user().withId('00000000-0000-4000-8000-000000000003').build();

            await setup.userRepo.insert(owner);
            await setup.userRepo.insert(member1);
            await setup.userRepo.insert(member2);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Create memberships: one active, one that left
            const membership1 = {
                id: setup.uuid.generate(),
                userId: member1.id,
                username: member1.username,
                organizationId: organization.id,
                roleCode: 'member' as const,
                joinedAt: new Date(),
                leftAt: undefined, // Active membership
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const membership2 = {
                id: setup.uuid.generate(),
                userId: member2.id,
                username: member2.username,
                organizationId: organization.id,
                roleCode: 'admin' as const,
                joinedAt: new Date(),
                leftAt: new Date('2025-01-10'), // User left voluntarily
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(membership1);
            await setup.uow.getOrganizationMembershipRepository().insert(membership2);

            // Archive the organization
            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: owner.externalId },
                { requestId: 'test-request-id', externalId: owner.id }
            );

            expect(result.isSuccess).toBe(true);

            // Verify memberships are NOT modified
            const organizationMemberships = await setup.uow
                .getOrganizationMembershipRepository()
                .findByOrganization(organization.id, false);
            expect(organizationMemberships.length).toBe(2);

            // Active membership should remain active
            const activeMembership = organizationMemberships.find((m) => m.userId === member1.id);
            expect(activeMembership?.deletedAt).toBeUndefined();
            expect(activeMembership?.leftAt).toBeUndefined();

            // Left membership should preserve its leftAt
            const leftMembership = organizationMemberships.find((m) => m.userId === member2.id);
            expect(leftMembership?.deletedAt).toBeUndefined();
            expect(leftMembership?.leftAt).toBeInstanceOf(Date);
        });
    });

    describe('Error Cases - Authorization', () => {
        it('should fail with UNAUTHORIZED when called by regular member', async () => {
            const owner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000001')
                .withExternalId('ext-00000000-0000-4000-8000-000000000001')
                .build();
            const member = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')
                .withExternalId('ext-00000000-0000-4000-8000-000000000002')
                .build();
            await setup.userRepo.insert(owner);
            await setup.userRepo.insert(member);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Create member membership (not admin or owner)
            const memberMembership = {
                id: setup.uuid.generate(),
                userId: member.id,
                username: member.username,
                organizationId: organization.id,
                roleCode: 'member' as const,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(memberMembership);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: member.externalId },
                { requestId: 'test-request-id', externalId: member.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
            expect(result.getError().message).toContain('owners and admins');
        });

        it('should fail with UNAUTHORIZED when called by non-member', async () => {
            const owner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000001')
                .withExternalId('ext-00000000-0000-4000-8000-000000000001')
                .build();
            const nonMember = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')
                .withExternalId('ext-00000000-0000-4000-8000-000000000002')
                .build();
            await setup.userRepo.insert(owner);
            await setup.userRepo.insert(nonMember);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: nonMember.externalId },
                { requestId: 'test-request-id', externalId: nonMember.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when organization does not exist', async () => {
            const user = TestData.user().build();
            await setup.userRepo.insert(user);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                {
                    organizationId: '11111111-1111-4111-8111-111111111111',
                    principalExternalId: user.externalId
                },
                { requestId: 'test-request-id', externalId: user.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail with VALIDATION_ERROR when organization is already archived', async () => {
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

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: owner.externalId },
                { requestId: 'test-request-id', externalId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('already archived');
        });

        it('should fail with VALIDATION_ERROR when organization is deleted', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const deletedDate = new Date('2025-01-15T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: deletedDate
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: owner.externalId },
                { requestId: 'test-request-id', externalId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('deleted organization');
        });

        it('should fail with VALIDATION_ERROR when organizationId is invalid format', async () => {
            const user = TestData.user().build();
            await setup.userRepo.insert(user);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: 'not-a-valid-uuid', principalExternalId: user.externalId } as any,
                { requestId: 'test-request-id', externalId: user.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });

        it('should fail with NOT_FOUND when principal user does not exist', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    principalExternalId: 'non-existent-external-id'
                },
                { requestId: 'test-request-id', externalId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                archivedAt: undefined,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Force UoW to throw during transaction
            (setup.uow as any).setTransactionError(new Error('tx failure'));

            const useCase = new ArchiveOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId: owner.externalId },
                { requestId: 'test-request-id', externalId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });
});
