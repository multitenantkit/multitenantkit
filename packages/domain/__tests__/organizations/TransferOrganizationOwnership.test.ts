import { describe, it, expect, beforeEach } from 'vitest';
import { TransferOrganizationOwnership } from '../../src/organizations/use-cases/transfer-organization-ownership/TransferOrganizationOwnership';
import { TestData } from '../test-helpers/Builders';
import { createTestSetup } from '../test-helpers/TestUtils';
import { type Adapters } from '@multitenantkit/domain-contracts';

describe('TransferOrganizationOwnership use case', () => {
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
        it('should transfer ownership successfully', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            // Create organization
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // Create memberships
            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const newOwnerMembership = {
                id: setup.uuid.generate(),
                userId: newOwner.id,
                username: newOwner.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(newOwnerMembership);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.id).toBe(organization.id);
            expect(out.ownerUserId).toBe(newOwner.id);
            expect(out.updatedAt).toBeDefined();

            // Verify organization ownership changed in repository
            const updatedOrganization = await setup.uow
                .getOrganizationRepository()
                .findById(organization.id);
            expect(updatedOrganization?.ownerUserId).toBe(newOwner.id);
        });

        it('should update old owner membership to member role', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const newOwnerMembership = {
                id: setup.uuid.generate(),
                userId: newOwner.id,
                username: newOwner.externalId,
                organizationId: organization.id,
                roleCode: 'admin' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(newOwnerMembership);

            const useCase = new TransferOrganizationOwnership(adapters);
            await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            // Verify old owner membership changed to member
            const memberships = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUser(currentOwner.id);
            const oldOwnerMembership = memberships.find(
                (m) => m.organizationId === organization.id
            );
            expect(oldOwnerMembership?.roleCode).toBe('member');
        });

        it('should update new owner membership to owner role', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const newOwnerMembership = {
                id: setup.uuid.generate(),
                userId: newOwner.id,
                username: newOwner.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(newOwnerMembership);

            const useCase = new TransferOrganizationOwnership(adapters);
            await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            // Verify new owner membership changed to owner
            const memberships = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUser(newOwner.id);
            const newOwnerMembershipUpdated = memberships.find(
                (m) => m.organizationId === organization.id
            );
            expect(newOwnerMembershipUpdated?.roleCode).toBe('owner');
        });

        it('should work regardless of new owner initial role (member, admin, etc)', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // New owner starts as admin
            const newOwnerMembership = {
                id: setup.uuid.generate(),
                userId: newOwner.id,
                username: newOwner.externalId,
                organizationId: organization.id,
                roleCode: 'admin' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(newOwnerMembership);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isSuccess).toBe(true);

            // Verify new owner is now owner
            const memberships = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUser(newOwner.id);
            const newOwnerMembershipUpdated = memberships.find(
                (m) => m.organizationId === organization.id
            );
            expect(newOwnerMembershipUpdated?.roleCode).toBe('owner');
        });

        it('should update updatedAt timestamp when transferring', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const oldDate = new Date('2025-01-01T10:00:00.000Z');
            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: oldDate,
                updatedAt: oldDate,
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: oldDate,
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: oldDate,
                updatedAt: oldDate
            };
            const newOwnerMembership = {
                id: setup.uuid.generate(),
                userId: newOwner.id,
                username: newOwner.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: oldDate,
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: oldDate,
                updatedAt: oldDate
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(newOwnerMembership);

            // Set clock to a different time
            const newDate = new Date('2025-02-01T10:00:00.000Z');
            setup.clock.setTime(newDate);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.updatedAt).toEqual(newDate);
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when organization does not exist', async () => {
            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                {
                    organizationId: '11111111-1111-4111-8111-111111111111',
                    newOwnerId: '22222222-2222-4222-8222-222222222222'
                },
                {
                    requestId: 'test-request-id',
                    actorUserId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
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
                deletedAt: deletedDate
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    newOwnerId: '22222222-2222-4222-8222-222222222222'
                },
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('deleted organization');
        });

        it('should fail with VALIDATION_ERROR when actor is not the current owner', async () => {
            const owner = TestData.user().build();
            const otherUser = TestData.user()
                .withId('00000000-0000-4000-8000-000000000099')
                .build();

            await setup.userRepo.insert(owner);
            await setup.userRepo.insert(otherUser);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: otherUser.id },
                { requestId: 'test-request-id', actorUserId: otherUser.id } // Not the owner!
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('current organization owner');
        });

        it('should fail with VALIDATION_ERROR when new owner is same as current owner', async () => {
            const owner = TestData.user().build();
            await setup.userRepo.insert(owner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: owner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: owner.id }, // Same as current owner!
                { requestId: 'test-request-id', actorUserId: owner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('different from current owner');
        });

        it('should fail with VALIDATION_ERROR when current owner user is deleted', async () => {
            const deletedOwner = TestData.user().withDeletedAt(new Date('2025-01-10')).build();
            await setup.userRepo.insert(deletedOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: deletedOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    newOwnerId: '22222222-2222-4222-8222-222222222222'
                },
                { requestId: 'test-request-id', actorUserId: deletedOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('Current owner user is deleted');
        });

        it('should fail with NOT_FOUND when new owner user does not exist', async () => {
            const currentOwner = TestData.user().build();
            await setup.userRepo.insert(currentOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                {
                    organizationId: organization.id,
                    newOwnerId: '99999999-9999-4999-8999-999999999999'
                },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail with VALIDATION_ERROR when new owner user is deleted', async () => {
            const currentOwner = TestData.user().build();
            const deletedNewOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')
                .withDeletedAt(new Date('2025-01-10'))
                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(deletedNewOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: deletedNewOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('New owner user is deleted');
        });

        it('should fail with VALIDATION_ERROR when current owner does not have active membership', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            // No membership for current owner!

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain(
                'Current owner does not have an active membership'
            );
        });

        it('should fail with VALIDATION_ERROR when new owner does not have active membership', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);

            // No membership for new owner!

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain(
                'New owner does not have an active membership'
            );
        });

        it('should fail with VALIDATION_ERROR when current owner membership has left the organization', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: new Date(), // Left the organization!
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const newOwnerMembership = {
                id: setup.uuid.generate(),
                userId: newOwner.id,
                username: newOwner.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(newOwnerMembership);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain(
                'Current owner does not have an active membership'
            );
        });

        it('should fail with VALIDATION_ERROR when new owner membership is deleted', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const newOwnerMembership = {
                id: setup.uuid.generate(),
                userId: newOwner.id,
                username: newOwner.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: new Date(), // Deleted!
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(newOwnerMembership);

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain(
                'New owner does not have an active membership'
            );
        });

        it('should fail with VALIDATION_ERROR when organizationId is invalid format', async () => {
            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                {
                    organizationId: 'not-a-valid-uuid',
                    newOwnerId: '22222222-2222-4222-8222-222222222222'
                } as any,
                {
                    requestId: 'test-request-id',
                    actorUserId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });

        it('should fail with VALIDATION_ERROR when newOwnerId is invalid format', async () => {
            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                {
                    organizationId: '11111111-1111-4111-8111-111111111111',
                    newOwnerId: 'not-a-valid-uuid'
                } as any,
                {
                    requestId: 'test-request-id',
                    actorUserId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            const currentOwner = TestData.user().build();
            const newOwner = TestData.user()
                .withId('00000000-0000-4000-8000-000000000002')

                .build();

            await setup.userRepo.insert(currentOwner);
            await setup.userRepo.insert(newOwner);

            const organization = {
                id: setup.uuid.generate(),
                ownerUserId: currentOwner.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
            await setup.uow.getOrganizationRepository().insert(organization);

            const currentOwnerMembership = {
                id: setup.uuid.generate(),
                userId: currentOwner.id,
                username: currentOwner.externalId,
                organizationId: organization.id,
                roleCode: 'owner' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const newOwnerMembership = {
                id: setup.uuid.generate(),
                userId: newOwner.id,
                username: newOwner.externalId,
                organizationId: organization.id,
                roleCode: 'member' as const,
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(currentOwnerMembership);
            await setup.uow.getOrganizationMembershipRepository().insert(newOwnerMembership);

            // Force UoW to throw during transaction
            (setup.uow as any).setTransactionError(new Error('tx failure'));

            const useCase = new TransferOrganizationOwnership(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, newOwnerId: newOwner.id },
                { requestId: 'test-request-id', actorUserId: currentOwner.id }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });
});
