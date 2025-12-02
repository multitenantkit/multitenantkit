import type { Adapters } from '@multitenantkit/domain-contracts';
import type { OrganizationMembership } from '@multitenantkit/domain-contracts/organization-memberships';
import { beforeEach, describe, expect, it } from 'vitest';
import { LeaveOrganization } from '../../src/organization-memberships/use-cases/leave-organization/LeaveOrganization';
import { createTestSetup } from '../test-helpers/TestUtils';

describe('LeaveOrganization use case', () => {
    let setup: ReturnType<typeof createTestSetup>;
    let adapters: Adapters;
    let principalExternalOwnerId: string;
    let ownerId: string;
    let organizationId: string;
    let principalExternalMemberId: string;
    let memberId: string;
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
        principalExternalMemberId = '00000000-0000-4000-8000-000000000002';
        memberId = '00000000-0000-4000-8000-000000000002';
        principalExternalAdminId = '00000000-0000-4000-8000-000000000003';
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
            id: memberId,
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

        // Create organization
        await setup.uow.getOrganizationRepository().insert({
            id: organizationId,
            ownerUserId: ownerId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });
    });

    describe('Happy Path - Regular member leaving', () => {
        beforeEach(async () => {
            // Create member membership
            const memberMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000100',
                userId: memberId,
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
            await setup.uow.getOrganizationMembershipRepository().insert(memberMembership);
        });

        it('should allow a regular member to leave the organization', async () => {
            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: principalExternalMemberId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.id).toBe('00000000-0000-4000-8000-000000000100');
            expect(membership.userId).toBe(memberId);
            expect(membership.organizationId).toBe(organizationId);
            expect(membership.roleCode).toBe('member');
            expect(membership.leftAt).toBeInstanceOf(Date);
            expect(membership.deletedAt).toBeUndefined();

            // Verify persistence
            const saved = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUserIdAndOrganizationId(memberId, organizationId);
            expect(saved).toBeDefined();
            expect(saved?.leftAt).toBeInstanceOf(Date);
        });

        it('should set leftAt and updatedAt to current timestamp', async () => {
            const fixedDate = new Date('2025-01-15T10:30:00.000Z');
            setup.clock.setTime(fixedDate);

            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: principalExternalMemberId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.leftAt?.getTime()).toBe(fixedDate.getTime());
            expect(membership.updatedAt?.getTime()).toBe(fixedDate.getTime());
        });

        it('should preserve original joinedAt and createdAt', async () => {
            const originalJoinedAt = new Date('2025-01-01T10:00:00.000Z');
            const originalCreatedAt = new Date('2025-01-01T10:00:00.000Z');

            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.joinedAt?.getTime()).toBe(originalJoinedAt.getTime());
            expect(membership.createdAt?.getTime()).toBe(originalCreatedAt.getTime());
        });
    });

    describe('Happy Path - Admin leaving', () => {
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
        });

        it('should allow an admin to leave the organization', async () => {
            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalAdminId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: principalExternalAdminId }
            );

            expect(result.isSuccess).toBe(true);
            const membership = result.getValue();
            expect(membership.roleCode).toBe('admin');
            expect(membership.leftAt).toBeInstanceOf(Date);
        });
    });

    describe('Error Cases - Organization validation', () => {
        it('should fail when organization does not exist', async () => {
            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId: '00000000-0000-4000-8000-999999999999' // Non-existent organization
                },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain('Organization');
        });
    });

    describe('Error Cases - Membership validation', () => {
        it('should fail when user has no membership in the organization', async () => {
            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain('OrganizationMembership');
        });

        it('should fail when user already left the organization', async () => {
            // Create membership that was already left
            const leftMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000300',
                userId: memberId,
                username: principalExternalMemberId,
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

            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toContain('OrganizationMembership');
        });

        it('should fail when membership is null', async () => {
            // No membership created
            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });
    });

    describe('Error Cases - Owner restrictions', () => {
        it('should fail when owner tries to leave the organization', async () => {
            // Owner membership is implicit, but let's create it explicitly for clarity
            const ownerMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000400',
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

            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalOwnerId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: principalExternalOwnerId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('owner cannot leave');
            expect(result.getError().message).toContain('Transfer ownership first');
        });
    });

    describe('Error Cases - Persistence', () => {
        beforeEach(async () => {
            // Create member membership for these tests
            const memberMembership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000500',
                userId: memberId,
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
            await setup.uow.getOrganizationMembershipRepository().insert(memberMembership);
        });

        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            (setup.uow as any).setTransactionError(new Error('Database connection failed'));

            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('Failed to leave organization');
        });
    });

    describe('Edge Cases', () => {
        it('should handle membership with invitedAt but has joinedAt', async () => {
            // Create membership that was invited and then joined
            const membership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000600',
                userId: memberId,
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
            await setup.uow.getOrganizationMembershipRepository().insert(membership);

            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isSuccess).toBe(true);
            const leftMembership = result.getValue();
            expect(leftMembership.leftAt).toBeInstanceOf(Date);
            expect(leftMembership.invitedAt).toBeInstanceOf(Date); // Preserved
            expect(leftMembership.joinedAt).toBeInstanceOf(Date); // Preserved
        });

        it('should not modify deletedAt when leaving', async () => {
            // Create regular active membership
            const membership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000700',
                userId: memberId,
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
            await setup.uow.getOrganizationMembershipRepository().insert(membership);

            const useCase = new LeaveOrganization(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isSuccess).toBe(true);
            const leftMembership = result.getValue();
            expect(leftMembership.deletedAt).toBeUndefined();
        });

        it('should leave organization successfully even with different actor in context', async () => {
            // Create membership
            const membership: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000800',
                userId: memberId,
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
            await setup.uow.getOrganizationMembershipRepository().insert(membership);

            const useCase = new LeaveOrganization(adapters);
            // Actor is different from userId (simulating admin action or system action)
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: ownerId } // Different actor
            );

            expect(result.isSuccess).toBe(true);
            const leftMembership = result.getValue();
            expect(leftMembership.leftAt).toBeInstanceOf(Date);
        });
    });

    describe('Multiple users leaving', () => {
        it('should handle multiple members leaving sequentially', async () => {
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

            // Create memberships for both members
            const membership1: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000000900',
                userId: memberId,
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

            const membership2: OrganizationMembership = {
                id: '00000000-0000-4000-8000-000000001000',
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

            await setup.uow.getOrganizationMembershipRepository().insert(membership1);
            await setup.uow.getOrganizationMembershipRepository().insert(membership2);

            const useCase = new LeaveOrganization(adapters);

            // First member leaves
            const result1 = await useCase.execute(
                {
                    principalExternalId: principalExternalMemberId,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: principalExternalMemberId }
            );

            expect(result1.isSuccess).toBe(true);

            // Second member leaves
            const result2 = await useCase.execute(
                {
                    principalExternalId: principalExternalMember2Id,
                    organizationId
                },
                { requestId: 'test-request-id', externalId: principalExternalMember2Id }
            );

            expect(result2.isSuccess).toBe(true);

            // Verify both left
            const saved1 = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUserIdAndOrganizationId(memberId, organizationId);
            const saved2 = await setup.uow
                .getOrganizationMembershipRepository()
                .findByUserIdAndOrganizationId(member2Id, organizationId);

            expect(saved1?.leftAt).toBeInstanceOf(Date);
            expect(saved2?.leftAt).toBeInstanceOf(Date);
        });
    });
});
