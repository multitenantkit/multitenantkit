import type { Adapters } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { AcceptOrganizationInvitation } from '../../src/organization-memberships/use-cases/accept-organization-invitation/AcceptOrganizationInvitation';
import { createTestSetup } from '../test-helpers/TestUtils';

describe('AcceptOrganizationInvitation use case', () => {
    let setup: ReturnType<typeof createTestSetup>;
    let adapters: Adapters;
    let principalExternalUserId: string;
    let userId: string;
    let username: string;
    let organizationId: string;
    let invitedMembershipId: string;

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
        principalExternalUserId = '00000000-0000-4000-8000-000000000001';
        userId = '00000000-0000-4000-8000-000000000001';
        username = 'inviteduser@example.com';
        organizationId = '00000000-0000-4000-8000-000000000010';
        invitedMembershipId = '00000000-0000-4000-8000-000000000020';

        // Create invited user
        await setup.userRepo.insert({
            id: userId,
            externalId: principalExternalUserId,
            username,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });

        // Create organization
        await setup.uow.getOrganizationRepository().insert({
            id: organizationId,
            ownerUserId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined
        });
    });

    describe('Happy Path', () => {
        it('should accept invitation successfully when user exists and invitation is pending', async () => {
            // Arrange: Create pending invitation
            await setup.uow.getOrganizationMembershipRepository().insert({
                id: invitedMembershipId,
                username,
                // userId not set yet (pending invitation)
                organizationId,
                roleCode: 'member',
                invitedAt: new Date(),
                // joinedAt, leftAt, deletedAt omitted (not accepted yet)
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Act
            const useCase = new AcceptOrganizationInvitation(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalUserId,
                    organizationId,
                    username
                },
                { requestId: 'test-request-id', externalId: principalExternalUserId }
            );

            // Assert
            expect(result.isSuccess).toBe(true);
            const output = result.getValue();
            expect(output.userId).toBe(userId);
            expect(output.joinedAt).toBeInstanceOf(Date);
            expect(output.invitedAt).toBeInstanceOf(Date);
            expect(output.leftAt).toBeUndefined();
            expect(output.deletedAt).toBeUndefined();
        });

        it('should link userId when invitation was created before user registered', async () => {
            // Simula: invitación enviada antes de que usuario se registre
            const newUsername = 'newuser@example.com';
            const newUserExternalId = '00000000-0000-4000-8000-000000000002';
            const newUserId = '00000000-0000-4000-8000-000000000002';

            // Create pending invitation without userId
            await setup.uow.getOrganizationMembershipRepository().insert({
                id: invitedMembershipId,
                username: newUsername,
                userId: undefined,
                organizationId,
                roleCode: 'member',
                invitedAt: new Date('2024-01-01'),
                joinedAt: undefined,
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            });

            // Usuario se registra después
            await setup.userRepo.insert({
                id: newUserId,
                externalId: newUserExternalId,
                username: newUsername,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            });

            // Usuario acepta invitación
            const useCase = new AcceptOrganizationInvitation(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: newUserExternalId,
                    organizationId,
                    username: newUsername
                },
                { requestId: 'test', externalId: newUserExternalId }
            );

            expect(result.isSuccess).toBe(true);
            const output = result.getValue();
            expect(output.userId).toBe(newUserId); // userId ahora está linkeado
            expect(output.joinedAt).toBeInstanceOf(Date);
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when user does not exist', async () => {
            const useCase = new AcceptOrganizationInvitation(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: 'non-existent-external-id',
                    organizationId,
                    username: 'nonexistent@example.com'
                },
                { requestId: 'test', externalId: 'non-existent-external-id' }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail with VALIDATION_ERROR when username mismatch', async () => {
            const otherUsername = 'other@example.com';

            // Create pending invitation for different username
            await setup.uow.getOrganizationMembershipRepository().insert({
                id: invitedMembershipId,
                username: otherUsername,
                userId: undefined,
                organizationId,
                roleCode: 'member',
                invitedAt: new Date(),
                joinedAt: undefined,
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const useCase = new AcceptOrganizationInvitation(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalUserId,
                    organizationId,
                    username: otherUsername // Trying to accept someone else's invitation
                },
                { requestId: 'test', externalId: principalExternalUserId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('Username mismatch');
        });

        it('should fail with NOT_FOUND when invitation does not exist', async () => {
            const useCase = new AcceptOrganizationInvitation(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalUserId,
                    organizationId,
                    username
                },
                { requestId: 'test', externalId: principalExternalUserId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });

        it('should fail with VALIDATION_ERROR when invitation already accepted', async () => {
            // Create already accepted invitation
            await setup.uow.getOrganizationMembershipRepository().insert({
                id: invitedMembershipId,
                username,
                userId,
                organizationId,
                roleCode: 'member',
                invitedAt: new Date('2024-01-01'),
                joinedAt: new Date('2024-01-02'), // Already accepted
                leftAt: undefined,
                deletedAt: undefined,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02')
            });

            const useCase = new AcceptOrganizationInvitation(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalUserId,
                    organizationId,
                    username
                },
                { requestId: 'test', externalId: principalExternalUserId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('already been accepted');
        });

        it('should fail with VALIDATION_ERROR when invitation was revoked (deleted)', async () => {
            // Create revoked invitation
            await setup.uow.getOrganizationMembershipRepository().insert({
                id: invitedMembershipId,
                username,
                userId: undefined,
                organizationId,
                roleCode: 'member',
                invitedAt: new Date('2024-01-01'),
                joinedAt: undefined,
                leftAt: undefined,
                deletedAt: new Date('2024-01-02'), // Revoked
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02')
            });

            const useCase = new AcceptOrganizationInvitation(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalUserId,
                    organizationId,
                    username
                },
                { requestId: 'test', externalId: principalExternalUserId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('revoked');
        });

        it('should fail with VALIDATION_ERROR when membership was left', async () => {
            // Create left membership
            await setup.uow.getOrganizationMembershipRepository().insert({
                id: invitedMembershipId,
                username,
                userId,
                organizationId,
                roleCode: 'member',
                invitedAt: new Date('2024-01-01'),
                joinedAt: new Date('2024-01-02'),
                leftAt: new Date('2024-01-03'), // Left
                deletedAt: undefined,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-03')
            });

            const useCase = new AcceptOrganizationInvitation(adapters);
            const result = await useCase.execute(
                {
                    principalExternalId: principalExternalUserId,
                    organizationId,
                    username
                },
                { requestId: 'test', externalId: principalExternalUserId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
            expect(result.getError().message).toContain('previously left');
        });
    });
});
