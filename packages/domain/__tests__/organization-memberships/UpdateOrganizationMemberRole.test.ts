import type { Adapters } from '@multitenantkit/domain-contracts';
import type { OrganizationMembership } from '@multitenantkit/domain-contracts/organization-memberships';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateOrganizationMemberRole } from '../../src/organization-memberships/use-cases/update-organization-member-role/UpdateOrganizationMemberRole';
import { createTestSetup } from '../test-helpers/TestUtils';

describe('UpdateOrganizationMemberRole use case', () => {
    let setup: ReturnType<typeof createTestSetup>;
    let adapters: Adapters;
    let userId: string;
    let ownerId: string;
    let principalExternalOwnerId: string;
    let organizationId: string;
    let targetMemberId: string;
    let principalExternalMemberId: string;
    let adminId: string;
    let principalExternalId: string;
    let principalExternalAdminId: string;

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
        userId = '00000000-0000-4000-8000-000000020000';
        principalExternalId = '00000000-0000-4000-8000-000000000000';

        principalExternalOwnerId = '00000000-0000-4000-9000-000000000001';
        ownerId = '00000000-0000-4000-8000-000000000001';

        organizationId = '00000000-0000-4000-8000-000000000010';

        principalExternalAdminId = '00000000-0000-4000-8000-000000000030';
        adminId = '00000000-0000-4000-8000-000000000003';

        targetMemberId = '00000000-0000-4000-8000-000000000002';
        principalExternalMemberId = '00000000-0000-4000-8000-000000000020';

        // Create users
        await setup.userRepo.insert({
            id: userId,
            externalId: principalExternalId,
            username: principalExternalId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });

        await setup.userRepo.insert({
            id: targetMemberId,
            externalId: principalExternalMemberId,
            username: principalExternalMemberId,
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

        await setup.userRepo.insert({
            id: ownerId,
            externalId: principalExternalOwnerId,
            username: principalExternalOwnerId,
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

    describe('Happy Path - Owner changing roles', () => {
        beforeEach(async () => {
            // Create target member membership
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000100',
                userId: targetMemberId,
                username: principalExternalMemberId,
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

        it('should allow owner to promote member to admin', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.id).toBe('00000000-0000-4000-8000-000000000100');
            expect(membership.userId).toBe(targetMemberId);
            expect(membership.roleCode).toBe('admin');

            // Verify persistence
            const saved = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUserIdAndOrganizationId(targetMemberId, organizationId);
            expect(saved?.roleCode).toBe('admin');
        });

        it('should allow owner to demote admin to member', async () => {
            // Update target to admin first
            const adminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000100',
                userId: targetMemberId,
                username: principalExternalMemberId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().update(adminMembership);

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('member');
        });

        it('should update updatedAt timestamp', async () => {
            const fixedDate = new Date('2025-01-15T10:30:00.000Z');
            setup.clock.setTime(fixedDate);

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.updatedAt?.getTime()).toBe(fixedDate.getTime());
        });

        it('should preserve other membership fields', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.joinedAt).toBeInstanceOf(Date);
            expect(membership.createdAt).toBeInstanceOf(Date);
            expect(membership.leftAt).toBeUndefined();
            expect(membership.deletedAt).toBeUndefined();
        });
    });

    describe('Happy Path - Admin changing roles', () => {
        beforeEach(async () => {
            // Create admin membership
            const adminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000200',
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
                id: '00000000-0000-4000-8000-000000000300',
                userId: targetMemberId,
                username: principalExternalMemberId,
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

        it('should allow admin to change member to member (no-op but valid)', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', externalId: principalExternalAdminId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('member');
        });

        it('should NOT allow admin to promote member to admin', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
            expect(result.getError().message).toContain('Insufficient permissions');
        });

        it('should allow admin to demote another admin to member', async () => {
            // Note: Current authorization logic allows admin to assign 'member' role
            // regardless of target's current role. This is different from RemoveOrganizationMember
            // which checks the target's current role.

            // Update target to admin
            const targetAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000300',
                userId: targetMemberId,
                username: principalExternalMemberId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().update(targetAdminMembership);

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', externalId: principalExternalAdminId }
            );

            // Based on current logic: admin can assign 'member' role
            expect(result.isSuccess).toBe(true);
            expect(result.getValue().roleCode).toBe('member');
        });
    });

    describe('Error Cases - Organization validation', () => {
        it('should fail when organization does not exist', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId,
                    organizationId: '00000000-0000-4000-8000-999999999999',
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain('Organization');
        });
    });

    describe('Error Cases - Target membership validation', () => {
        it('should fail when target membership does not exist', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain(
                `OrganizationMembership with identifier '${targetMemberId}:${organizationId}' not found`
            );
        });

        it('should fail when target membership has leftAt set', async () => {
            const leftMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000400',
                userId: targetMemberId,
                username: principalExternalMemberId,
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

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail when target membership has deletedAt set', async () => {
            const deletedMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000500',
                userId: targetMemberId,
                username: principalExternalMemberId,
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

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail when trying to change owner role', async () => {
            // Create owner membership
            const ownerMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000600',
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

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId,
                    organizationId,
                    targetUserId: ownerId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain(
                'Organization owner role cannot be changed. Use transfer ownership instead.'
            );
        });
    });

    describe('Error Cases - Authorization', () => {
        let regularMemberId: string;
        let principalExternalRegularMemberId: string;

        beforeEach(async () => {
            principalExternalRegularMemberId = '00000000-0000-4000-8000-000000000024';
            regularMemberId = '00000000-0000-4000-8000-000000000004';

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
                id: '00000000-0000-4000-8000-000000000700',
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
                id: '00000000-0000-4000-8000-000000000800',
                userId: targetMemberId,
                username: principalExternalMemberId,
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
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalRegularMemberId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalRegularMemberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when actor is not a member of the organization', async () => {
            const principalExternalNonMemberId = '00000000-0000-4000-8000-000000000005';
            const nonMemberId = '00000000-0000-4000-8000-000000000005';

            // Create non-member user
            await setup.userRepo.insert({
                id: nonMemberId,
                externalId: principalExternalNonMemberId,
                username: principalExternalNonMemberId,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalNonMemberId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: nonMemberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when actor admin membership has leftAt set', async () => {
            // Create former admin
            const formerAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000900',
                userId: adminId,
                username: principalExternalAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: new Date('2025-01-10T10:00:00.000Z'),
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-10T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(formerAdminMembership);

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', externalId: principalExternalAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when actor admin membership has deletedAt set', async () => {
            // Create deleted admin
            const deletedAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001000',
                userId: adminId,
                username: principalExternalAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: new Date('2025-01-15T10:00:00.000Z'),
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-15T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(deletedAdminMembership);

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', externalId: principalExternalAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });

        it('should fail when actor admin membership has no joinedAt', async () => {
            // Create invited but not joined admin
            const invitedAdminMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001100',
                userId: adminId,
                username: principalExternalAdminId,
                organizationId,
                roleCode: 'admin',
                invitedAt: new Date('2025-01-01T10:00:00.000Z'),
                joinedAt: undefined,
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2025-01-01T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().insert(invitedAdminMembership);

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', externalId: principalExternalAdminId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });
    });

    describe('Error Cases - Persistence', () => {
        beforeEach(async () => {
            // Create target member membership for these tests
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001200',
                userId: targetMemberId,
                username: principalExternalMemberId,
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

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain(
                'Failed to update organization member role'
            );
        });

        it('should fail when target membership not found in executeBusinessLogic', async () => {
            // Remove the membership before executeBusinessLogic runs
            await setup.uow
                .getOrganizationMembershipRepository()
                .delete('00000000-0000-4000-8000-000000001200');

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });
    });

    describe('Edge Cases', () => {
        beforeEach(async () => {
            // Create target membership for these tests
            const targetMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001300',
                userId: targetMemberId,
                username: principalExternalMemberId,
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

        it('should handle updating role to same role (no-op)', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'member' // Same as current
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('member');
        });

        it('should handle membership with invitedAt', async () => {
            // Update membership to have invitedAt
            const membershipWithInvite: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001300',
                userId: targetMemberId,
                username: principalExternalMemberId,
                organizationId,
                roleCode: 'member',
                invitedAt: new Date('2024-12-25T10:00:00.000Z'),
                joinedAt: new Date('2025-01-01T10:00:00.000Z'),
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2024-12-25T10:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z')
            };
            await setup.uow.getOrganizationMembershipRepository().update(membershipWithInvite);

            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('admin');
            expect(membership.invitedAt).toBeInstanceOf(Date); // Preserved
        });

        it('should allow owner to update role even without membership record', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('admin');
        });

        it('should handle multiple role changes sequentially', async () => {
            const useCase = new UpdateOrganizationMemberRole(adapters);

            // Change 1: member -> admin
            const result1 = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );
            expect(result1.isSuccess).toBe(true);
            expect(result1.getValue().roleCode).toBe('admin');

            // Change 2: admin -> member
            const result2 = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'member'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );
            expect(result2.isSuccess).toBe(true);
            expect(result2.getValue().roleCode).toBe('member');

            // Change 3: member -> admin again
            const result3 = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId,
                    targetUserId: targetMemberId,
                    roleCode: 'admin'
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );
            expect(result3.isSuccess).toBe(true);
            expect(result3.getValue().roleCode).toBe('admin');
        });
    });
});
