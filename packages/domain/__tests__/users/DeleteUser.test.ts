import type { Adapters } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteUser } from '../../src/users/use-cases/delete-user/DeleteUser';
import { TestData } from '../test-helpers/Builders';
import { createTestSetup } from '../test-helpers/TestUtils';

describe('DeleteUser use case', () => {
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
        it('should soft delete user successfully', async () => {
            const user = TestData.user().build();
            await setup.userRepo.insert(user);

            const useCase = new DeleteUser(adapters);
            // userId in DTO is actually externalId (auth provider ID)
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', externalId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.id).toBe(user.id);
            expect(out.deletedAt).toBeInstanceOf(Date);
            expect(out.updatedAt).toBeInstanceOf(Date);

            // Verify user is marked as deleted in repository
            const fromRepo = await setup.userRepo.findById(user.id);
            expect(fromRepo).toBeDefined();
            expect(fromRepo?.deletedAt).toBeInstanceOf(Date);
        });

        it('should update updatedAt timestamp when deleting', async () => {
            const oldDate = new Date('2025-01-01T10:00:00.000Z');
            const user = TestData.user().withCreatedAt(oldDate).withUpdatedAt(oldDate).build();
            await setup.userRepo.insert(user);

            // Set clock to a different time
            const newDate = new Date('2025-02-01T10:00:00.000Z');
            setup.clock.setTime(newDate);

            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', externalId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.updatedAt).toEqual(newDate);
            expect(out.deletedAt).toEqual(newDate);
        });

        it('should preserve email and other user data when soft deleting', async () => {
            const user = TestData.user().withId('00000000-0000-4000-8000-000000000123').build();
            await setup.userRepo.insert(user);

            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', externalId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.externalId).toBe(user.externalId);
            expect(out.id).toBe('00000000-0000-4000-8000-000000000123');
            expect(out.createdAt).toEqual(user.createdAt);
        });

        it('should soft delete all organizations owned by the user', async () => {
            const user = TestData.user().build();
            await setup.userRepo.insert(user);

            // Create organizations owned by the user
            const organization1 = {
                id: setup.uuid.generate(),
                ownerUserId: user.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            const organization2 = {
                id: setup.uuid.generate(),
                ownerUserId: user.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization1);
            await setup.uow.getOrganizationRepository().insert(organization2);

            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', externalId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);

            // Verify organizations are marked as deleted
            const organizations = await setup.uow.getOrganizationRepository().findByOwner(user.id);
            expect(organizations.every((t) => t.deletedAt instanceof Date)).toBe(true);
        });

        it('should soft delete all organization memberships for the user', async () => {
            const user = TestData.user().build();
            const owner = TestData.user().withId('00000000-0000-4000-8000-000000000001').build();
            await setup.userRepo.insert(user);
            await setup.userRepo.insert(owner);

            // Create a organization and membership
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const membership = {
                id: setup.uuid.generate(),
                userId: user.id,
                username: user.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(membership);

            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', externalId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);

            // Verify membership is marked as left and deleted
            const memberships = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUser(user.id);
            expect(
                memberships.every((m) => m.leftAt instanceof Date && m.deletedAt instanceof Date)
            ).toBe(true);
        });

        it('should NOT modify memberships in organizations owned by the user (preserves state for restore)', async () => {
            const owner = TestData.user().build();
            const member1 = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();
            const member2 = TestData.user().withId('00000000-0000-4000-8000-000000000003').build();

            await setup.userRepo.insert(owner);
            await setup.userRepo.insert(member1);
            await setup.userRepo.insert(member2);

            // Create a organization owned by the user
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Create memberships: one active, one that left, one explicitly deleted
            const membership1 = {
                id: setup.uuid.generate(),
                userId: member1.id,
                username: member1.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined, // Active membership
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const membership2 = {
                id: setup.uuid.generate(),
                userId: member2.id,
                username: member2.externalId,
                organizationId: organization.id,
                roleCode: 'admin' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: new Date('2025-01-10'), // User left voluntarily
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(membership1);
            await setup.uow.getOrganizationMembershipRepository().insert(membership2);

            // Delete the owner (which cascades to delete the organization)
            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: owner.externalId },
                { requestId: 'test-request-id', externalId: owner.externalId }
            );

            expect(result.isSuccess).toBe(true);

            // Verify organization is deleted
            const organizations = await setup.uow.getOrganizationRepository().findByOwner(owner.id);
            expect(organizations.every((t) => t.deletedAt instanceof Date)).toBe(true);

            // Verify memberships are NOT modified - preserves state for future restore
            const organizationMemberships = await setup.uow
                .getOrganizationMembershipRepository()
                .findByOrganization(organization.id, false);
            expect(organizationMemberships.length).toBe(2);

            // Active membership should remain active (deletedAt=null)
            const activeMembership = organizationMemberships.find((m) => m.userId === member1.id);
            expect(activeMembership?.deletedAt).toBeUndefined();
            expect(activeMembership?.leftAt).toBeUndefined();

            // Left membership should preserve its leftAt, no deletedAt
            const leftMembership = organizationMemberships.find((m) => m.userId === member2.id);
            expect(leftMembership?.deletedAt).toBeUndefined();
            expect(leftMembership?.leftAt).toBeInstanceOf(Date);
        });

        it('should set leftAt when user leaves organizations they do not own', async () => {
            const member = TestData.user().build();
            const owner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000099')

                .build();
            await setup.userRepo.insert(member);
            await setup.userRepo.insert(owner);

            // Create a organization NOT owned by member
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Member joins the organization
            const membership = {
                id: setup.uuid.generate(),
                userId: member.id,
                username: member.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(membership);

            // Delete the member
            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: member.externalId },
                { requestId: 'test-request-id', externalId: member.externalId }
            );

            expect(result.isSuccess).toBe(true);

            // Verify membership has BOTH leftAt and deletedAt set
            const memberships = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUser(member.id);
            expect(memberships.length).toBe(1);
            expect(memberships[0].leftAt).toBeInstanceOf(Date);
            expect(memberships[0].deletedAt).toBeInstanceOf(Date);
        });

        it('should handle user with no organizations or memberships', async () => {
            const user = TestData.user().build();
            await setup.userRepo.insert(user);

            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', externalId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().deletedAt).toBeInstanceOf(Date);
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when user does not exist', async () => {
            const useCase = new DeleteUser(adapters);
            // Pass an externalId that doesn't exist
            const nonExistentExternalId = '11111111-1111-4111-8111-111111111111';
            const result = await useCase.execute(
                { principalExternalId: nonExistentExternalId }, // userId is actually externalId
                {
                    requestId: 'test-request-id',
                    externalId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain(
                `User with identifier '${nonExistentExternalId}' not found`
            );
        });

        it('should fail with VALIDATION_ERROR when user is already deleted', async () => {
            const deletedDate = new Date('2025-01-15T10:00:00.000Z');
            const user = TestData.user().withDeletedAt(deletedDate).build();
            await setup.userRepo.insert(user);

            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', externalId: user.externalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            // Error is from business logic, not wrapped
            expect(result.getError().message).toContain('already deleted');
        });

        it('should fail with VALIDATION_ERROR when userId is invalid format', async () => {
            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: 'not-a-valid-uuid' } as any,
                {
                    externalId: '00000000-0000-4000-8000-000000000000',
                    requestId: 'test-request-id'
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            const user = TestData.user().build();
            await setup.userRepo.insert(user);

            // Force UoW to throw during transaction
            (setup.uow as any).setTransactionError(new Error('tx failure'));

            const useCase = new DeleteUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', externalId: user.externalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });
});
