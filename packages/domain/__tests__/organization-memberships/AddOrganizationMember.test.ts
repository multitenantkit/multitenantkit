import { describe, it, expect, beforeEach } from 'vitest';
import { AddOrganizationMember } from '../../src/organization-memberships/use-cases/add-organization-member/AddOrganizationMember';
import { createTestSetup } from '../test-helpers/TestUtils';
import { type Adapters } from '@multitenantkit/domain-contracts';
import { OrganizationMembership } from '@multitenantkit/domain-contracts/organization-memberships';

describe('AddOrganizationMember use case', () => {
    let setup: ReturnType<typeof createTestSetup>;
    let adapters: Adapters;
    let principalExternalOwnerId: string;
    let ownerId: string;
    let organizationId: string;
    let principalExternalTargetUserId: string;
    let targetUserId: string;

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
        principalExternalTargetUserId = '00000000-0000-4000-8000-000000000002';
        targetUserId = '00000000-0000-4000-8000-000000000002';

        // Create owner user
        await setup.userRepo.insert({
            id: ownerId,
            externalId: principalExternalOwnerId,
            username: principalExternalOwnerId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });

        // Create target user
        await setup.userRepo.insert({
            id: targetUserId,
            externalId: principalExternalTargetUserId,
            username: principalExternalTargetUserId,
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

    describe('Happy Path - Owner adding members', () => {
        it('should allow owner to add a member with "member" role', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.id).toBe('00000000-0000-4000-8000-000000000001');
            expect(membership.userId).toBe(targetUserId);
            expect(membership.organizationId).toBe(organizationId);
            expect(membership.roleCode).toBe('member');
            expect(membership.invitedAt).toBeInstanceOf(Date); // Invited, not joined yet
            expect(membership.joinedAt).toBeUndefined(); // Will be set when user accepts
            expect(membership.leftAt).toBeUndefined();
            expect(membership.deletedAt).toBeUndefined();

            // Verify persistence
            const saved = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUserIdAndOrganizationId(targetUserId, organizationId);
            expect(saved).toBeDefined();
            expect(saved?.roleCode).toBe('member');
        });

        it('should allow owner to add a member with "admin" role', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalOwnerId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('admin');
        });

        it('should use current timestamp for joinedAt, createdAt, updatedAt', async () => {
            const fixedDate = new Date('2025-01-15T10:30:00.000Z');
            setup.clock.setTime(fixedDate);

            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalOwnerId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.invitedAt?.getTime()).toBe(fixedDate.getTime()); // Invitation time
            expect(membership.joinedAt).toBeUndefined(); // Not joined yet
            expect(membership.createdAt?.getTime()).toBe(fixedDate.getTime());
            expect(membership.updatedAt?.getTime()).toBe(fixedDate.getTime());
        });
    });

    describe('Happy Path - Admin adding members', () => {
        let adminId: string;
        let principalExternalAdminId: string;

        beforeEach(async () => {
            principalExternalAdminId = '00000000-0000-4000-8000-000000000003';
            adminId = '00000000-0000-4000-8000-000000000003';

            // Create admin user
            await setup.userRepo.insert({
                id: adminId,
                externalId: principalExternalAdminId,
                username: principalExternalAdminId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Create admin membership
            const adminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000100',
                username: principalExternalAdminId,
                userId: adminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(adminMembership);
        });

        it('should allow admin to add a member with "member" role', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    username: principalExternalTargetUserId, // Add the target user
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalAdminId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('member');
            expect(membership.username).toBe(principalExternalTargetUserId);
        });

        it('should NOT allow admin to add a member with "admin" role', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    username: principalExternalTargetUserId, // Try to add target as admin
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
            expect(result.getError().message).toContain(
                'Only organization owners and admins can add members'
            );
        });
    });

    describe('Reactivation - User who left rejoining', () => {
        beforeEach(async () => {
            // Create a membership that was left
            const leftMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000200',
                userId: targetUserId,
                username: principalExternalTargetUserId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: new Date('2025-01-10T10:00:00.000Z'),
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-10T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(leftMembership);
        });

        it('should reactivate membership when adding a user who previously left', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.id).toBe('00000000-0000-4000-8000-000000000200'); // Same ID, reactivated
            expect(membership.leftAt).toBeUndefined(); // No longer left
            expect(membership.deletedAt).toBeUndefined();
            expect(membership.invitedAt).toBeInstanceOf(Date); // Re-invited
            expect(membership.joinedAt).toBeUndefined(); // Needs to accept again
        });

        it('should update role when reactivating with different role', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'admin' // Different role than before
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('admin');
            expect(membership.leftAt).toBeUndefined();
        });

        it('should keep same role when reactivating with same role', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member' // Same role as before
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('member');
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail when organization does not exist', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId: '00000000-0000-4000-8000-999999999999', // Non-existent organization
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain('Organization');
        });

        it('should create membership with undefined userId when target user does not exist', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: 'nonexistent@example.com', // Non-existent user (email invitation)
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: ownerId }
            );

            // Should succeed and create membership with undefined userId (invitation)
            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.userId).toBeUndefined(); // User doesn't exist yet
            expect(membership.username).toBe('nonexistent@example.com');
            expect(membership.invitedAt).toBeInstanceOf(Date); // Invited
            expect(membership.joinedAt).toBeUndefined(); // Can't join until user exists
        });

        it('should fail when user is already an active member', async () => {
            // First add the member
            const membership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000300',
                userId: targetUserId,
                username: principalExternalTargetUserId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(membership);

            // Try to add again
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('CONFLICT');
            expect(result.getError().message).toContain('already exists');
        });
    });

    describe('Error Cases - Authorization', () => {
        let principalExternalNonMemberId: string;
        let nonMemberId: string;

        beforeEach(async () => {
            principalExternalNonMemberId = '00000000-0000-4000-8000-000000000004';
            nonMemberId = '00000000-0000-4000-8000-000000000004';

            // Create non-member user
            await setup.userRepo.insert({
                id: nonMemberId,
                username: principalExternalNonMemberId,
                externalId: principalExternalNonMemberId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });
        });

        it('should fail when actor is not owner or admin', async () => {
            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalNonMemberId,
                    organizationId,
                    username: principalExternalNonMemberId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: nonMemberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when admin membership has leftAt set', async () => {
            const principalExternalFormerAdminId = '00000000-0000-4000-8000-000000000005';
            const formerAdminId = '00000000-0000-4000-8000-000000000005';

            // Create former admin user
            await setup.userRepo.insert({
                id: formerAdminId,
                username: principalExternalFormerAdminId,
                externalId: principalExternalFormerAdminId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Create former admin membership (left the organization)
            const formerAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000400',
                userId: formerAdminId,
                username: principalExternalFormerAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: new Date('2025-01-10T10:00:00.000Z'), // Left the organization
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(formerAdminMembership);

            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalFormerAdminId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalFormerAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when admin membership has deletedAt set', async () => {
            const principalExternalDeletedAdminId = '00000000-0000-4000-8000-000000000006';
            const deletedAdminId = '00000000-0000-4000-8000-000000000006';

            // Create deleted admin user
            await setup.userRepo.insert({
                id: deletedAdminId,
                username: principalExternalDeletedAdminId,
                externalId: principalExternalDeletedAdminId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Create deleted admin membership
            const deletedAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000500',
                username: principalExternalDeletedAdminId,
                userId: deletedAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: new Date(), // Deleted
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(deletedAdminMembership);

            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalDeletedAdminId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalDeletedAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when admin membership has no joinedAt', async () => {
            const principalExternalInvitedAdminId = '00000000-0000-4000-8000-000000000007';
            const invitedAdminId = '00000000-0000-4000-8000-000000000007';

            // Create invited admin user
            await setup.userRepo.insert({
                id: invitedAdminId,
                externalId: principalExternalInvitedAdminId,
                username: principalExternalInvitedAdminId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Create invited but not joined admin membership
            const invitedAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000600',
                username: principalExternalInvitedAdminId,
                userId: invitedAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: new Date(),
                joinedAt: undefined, // Not joined yet
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(invitedAdminMembership);

            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalInvitedAdminId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: invitedAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            (setup.uow as any).setTransactionError(new Error('Database connection failed'));

            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('Failed to save organization membership');
        });
    });

    describe('Edge Cases', () => {
        it('should handle regular member trying to add another member', async () => {
            const principalExternalMemberId = '00000000-0000-4000-8000-000000000008';
            const memberId = '00000000-0000-4000-8000-000000000008';

            // Create regular member user
            await setup.userRepo.insert({
                id: memberId,
                externalId: principalExternalMemberId,
                username: principalExternalMemberId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Create regular member membership
            const memberMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000700',
                username: principalExternalMemberId,
                userId: memberId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date(),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setup.uow.getOrganizationMembershipRepository().insert(memberMembership);

            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalMemberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should handle adding user who was deleted and then left', async () => {
            // Create a membership that was deleted AND left (edge case)
            const deletedAndLeftMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000800',
                username: principalExternalTargetUserId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: new Date('2025-01-10T10:00:00.000Z'),
                deletedAt: new Date('2025-01-15T10:00:00.000Z'),
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-15T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(deletedAndLeftMembership);

            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            // Should create NEW membership since existing one is deleted
            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.id).toBe('00000000-0000-4000-8000-000000000001'); // New ID
            expect(membership.deletedAt).toBeUndefined();
            expect(membership.leftAt).toBeUndefined();
        });

        it('should handle adding user who was only deleted (not left)', async () => {
            // Create a membership that was deleted but never left
            const deletedMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000900',
                username: principalExternalTargetUserId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: new Date('2025-01-15T10:00:00.000Z'),
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-15T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(deletedMembership);

            const useCase = new AddOrganizationMember(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    username: principalExternalTargetUserId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', actorUserId: principalExternalOwnerId }
            );

            // Should create NEW membership since existing one is deleted
            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.id).toBe('00000000-0000-4000-8000-000000000001'); // New ID
            expect(membership.deletedAt).toBeUndefined();
        });
    });
});
