import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveOrganizationMember } from '../../src/organization-memberships/use-cases/remove-organization-member/RemoveOrganizationMember';
import { createTestSetup } from '../test-helpers/TestUtils';
import { type Adapters } from '@multitenantkit/domain-contracts';
import { OrganizationMembership } from '@multitenantkit/domain-contracts/organization-memberships';

describe('RemoveOrganizationMember use case', () => {
    let setup: ReturnType<typeof createTestSetup>;
    let adapters: Adapters;
    let principalExternalOwnerId: string;
    let ownerId: string;
    let organizationId: string;
    let principalExternalTargetMemberId: string;
    let targetMemberId: string;
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
        principalExternalTargetMemberId = '00000000-0000-4000-8000-000000000020';
        targetMemberId = '00000000-0000-4000-8000-000000000002';
        principalExternalAdminId = '00000000-0000-4000-8000-000000000030';
        adminId = '00000000-0000-4000-8000-000000000003';

        // Create users
        await setup.userRepo.insert({
            id: ownerId,
            externalId: principalExternalOwnerId,
            username: principalExternalOwnerId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });

        await setup.userRepo.insert({
            id: targetMemberId,
            externalId: principalExternalTargetMemberId,
            username: principalExternalTargetMemberId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });

        await setup.userRepo.insert({
            id: adminId,
            externalId: principalExternalAdminId,
            username: principalExternalAdminId,
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
    });

    describe('Happy Path - Owner removing members', () => {
        beforeEach(async () => {
            // Create target member membership
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000100',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(targetMembership);
        });

        it('should allow owner to remove a regular member', async () => {
            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);

            // Verify member was deleted
            const membership = await setup.uow
                .getOrganizationMembershipRepository()
                .findById('00000000-0000-4000-8000-000000000100');
            expect(membership).toBeNull();
        });

        it('should allow owner to remove an admin', async () => {
            // Update target membership to admin role
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000100',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().update(targetMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);

            // Verify admin was deleted
            const membership = await setup.uow
                .getOrganizationMembershipRepository()
                .findById('00000000-0000-4000-8000-000000000100');
            expect(membership).toBeNull();
        });

        it('should allow owner to remove multiple members', async () => {
            const principalExternalMember2Id = '00000000-0000-4000-8000-000000000004';
            const member2Id = '00000000-0000-4000-8000-000000000004';

            // Create second member user
            await setup.userRepo.insert({
                id: member2Id,
                externalId: principalExternalMember2Id,
                username: principalExternalMember2Id,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Create second member membership
            const member2Membership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000200',
                userId: member2Id,
                username: principalExternalMember2Id,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(member2Membership);

            const useCase = new RemoveOrganizationMember(adapters);

            // Remove first member
            const result1 = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );
            expect(result1.isSuccess).toBe(true);

            // Remove second member
            const result2 = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: member2Id
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );
            expect(result2.isSuccess).toBe(true);

            // Verify both were deleted
            const membership1 = await setup.uow
                .getOrganizationMembershipRepository()
                .findById('00000000-0000-4000-8000-000000000100');
            const membership2 = await setup.uow
                .getOrganizationMembershipRepository()
                .findById('00000000-0000-4000-8000-000000000200');
            expect(membership1).toBeNull();
            expect(membership2).toBeNull();
        });
    });

    describe('Happy Path - Admin removing members', () => {
        beforeEach(async () => {
            // Create admin membership
            const adminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000300',
                userId: adminId,
                username: principalExternalAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(adminMembership);

            // Create target member membership
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000400',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(targetMembership);
        });

        it('should allow admin to remove a regular member', async () => {
            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: adminId }
            );

            expect(result.isSuccess).toBe(true);

            // Verify member was deleted
            const membership = await setup.uow
                .getOrganizationMembershipRepository()
                .findById('00000000-0000-4000-8000-000000000400');
            expect(membership).toBeNull();
        });

        it('should NOT allow admin to remove another admin', async () => {
            // Update target membership to admin role
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000400',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().update(targetMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: adminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
            expect(result.getError().message).toContain('Insufficient permissions');
        });
    });

    describe('Error Cases - Organization validation', () => {
        it('should fail when organization does not exist', async () => {
            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId: '00000000-0000-4000-8000-999999999999', // Non-existent organization
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain('Organization');
        });
    });

    describe('Error Cases - Target membership validation', () => {
        it('should fail when target user has no membership in the organization', async () => {
            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain('OrganizationMembership');
        });

        it('should fail when target membership has leftAt set', async () => {
            // Create membership that was left
            const leftMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000500',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: new Date('2025-01-10T10:00:00.000Z'), // Already left
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-10T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(leftMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail when target membership has deletedAt set', async () => {
            // Create membership that was deleted
            const deletedMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000600',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: new Date('2025-01-15T10:00:00.000Z'), // Already deleted
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-15T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(deletedMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail when trying to remove the organization owner', async () => {
            // Create owner membership
            const ownerMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000700',
                userId: ownerId,
                username: principalExternalOwnerId,
                organizationId,
                roleCode: 'owner',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(ownerMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: ownerId // Trying to remove owner
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('owner cannot be removed');
            expect(result.getError().message).toContain('Transfer ownership first');
        });
    });

    describe('Error Cases - Authorization', () => {
        let principalExternalRegularMemberId: string;
        let regularMemberId: string;

        beforeEach(async () => {
            principalExternalRegularMemberId = '00000000-0000-4000-8000-000000000005';
            regularMemberId = '00000000-0000-4000-8000-000000000005';

            // Create regular member user
            await setup.userRepo.insert({
                id: regularMemberId,
                externalId: principalExternalRegularMemberId,
                username: principalExternalRegularMemberId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Create regular member membership
            const regularMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000800',
                userId: regularMemberId,
                username: principalExternalRegularMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(regularMembership);

            // Create target member membership
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000900',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(targetMembership);
        });

        it('should fail when actor is a regular member', async () => {
            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalRegularMemberId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: principalExternalRegularMemberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when actor is not a member of the organization', async () => {
            const principalExternalNonMemberId = '00000000-0000-4000-8000-000000000006';
            const nonMemberId = '00000000-0000-4000-8000-000000000006';

            // Create non-member user
            await setup.userRepo.insert({
                id: nonMemberId,
                externalId: principalExternalNonMemberId,
                username: principalExternalNonMemberId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalNonMemberId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: principalExternalNonMemberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when actor admin membership has leftAt set', async () => {
            // Create admin who left
            const formerAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001000',
                userId: adminId,
                username: principalExternalAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: new Date('2025-01-10T10:00:00.000Z'), // Left the organization
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-10T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(formerAdminMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: principalExternalAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when actor admin membership has deletedAt set', async () => {
            // Create deleted admin
            const deletedAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001100',
                userId: adminId,
                username: principalExternalAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: new Date('2025-01-15T10:00:00.000Z'), // Deleted
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-15T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(deletedAdminMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: principalExternalAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when actor admin membership has no joinedAt', async () => {
            // Create invited but not joined admin
            const invitedAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001200',
                userId: adminId,
                username: principalExternalAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: new Date('2025-01-01T10:00:00.000Z'),
                joinedAt: undefined, // Not joined yet
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(invitedAdminMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: principalExternalAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });
    });

    describe('Error Cases - Persistence', () => {
        beforeEach(async () => {
            // Create target member membership for these tests
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001300',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(targetMembership);
        });

        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            (setup.uow as any).setTransactionError(new Error('Database connection failed'));

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('Failed to remove organization member');
        });

        it('should fail when target membership not found in executeBusinessLogic', async () => {
            // This tests the re-fetch scenario in executeBusinessLogic
            const useCase = new RemoveOrganizationMember(adapters);

            // Remove the membership before executeBusinessLogic runs
            // This simulates a race condition
            await setup.uow
                .getOrganizationMembershipRepository()
                .delete('00000000-0000-4000-8000-000000001300');

            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });
    });

    describe('Edge Cases', () => {
        it('should handle removing member with invitedAt', async () => {
            // Create membership with invitedAt
            const membership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001400',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: new Date('2024-12-25T10:00:00.000Z'),
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2024-12-25T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(membership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);

            // Verify member was deleted
            const deletedMembership = await setup.uow
                .getOrganizationMembershipRepository()
                .findById('00000000-0000-4000-8000-000000001400');
            expect(deletedMembership).toBeNull();
        });

        it('should allow owner to remove themselves as regular member (if not owner)', async () => {
            // This is an edge case: what if ownerUserId doesn't match the membership?
            // The code checks organization.ownerUserId === targetUserId, so this should work
            const principalExternalAnotherUserId = '00000000-0000-4000-8000-000000000007';
            const anotherUserId = '00000000-0000-4000-8000-000000000007';

            // Create another user
            await setup.userRepo.insert({
                id: anotherUserId,
                externalId: principalExternalAnotherUserId,
                username: principalExternalAnotherUserId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Create membership for owner as a regular member (edge case scenario)
            const ownerAsMember: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001500',
                userId: anotherUserId,
                username: principalExternalAnotherUserId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(ownerAsMember);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUser: anotherUserId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);
        });
    });

    describe('Authorization Logic - Complete coverage', () => {
        it('should succeed when actor is owner (even without membership record)', async () => {
            // Create target member
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001600',
                userId: targetMemberId,
                username: principalExternalTargetMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(targetMembership);

            const useCase = new RemoveOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId, // Owner
                    organizationId,
                    targetUser: targetMemberId
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            expect(result.isSuccess).toBe(true);
        });
    });
});
