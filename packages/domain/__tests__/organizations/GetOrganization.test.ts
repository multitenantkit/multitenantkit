import type { Adapters, ToolkitOptions } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetOrganization } from '../../src/organizations/use-cases/get-organization/GetOrganization';
import { createTestSetup } from '../test-helpers/TestUtils';

function createOrganization(
    params: Partial<{
        id: string;
        ownerUserId: string;
        deletedAt?: Date | null;
        extra?: Record<string, unknown>;
    }>
): any {
    return {
        id: params.id ?? '70000000-0000-4000-8000-000000000000',
        ownerUserId: params.ownerUserId ?? '00000000-0000-4000-8000-000000000000',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        deletedAt: params.deletedAt ?? undefined,
        ...(params.extra ?? {})
    };
}

describe('GetOrganization use case', () => {
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
        it('should return organization for owner', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000A001';
            const organization = createOrganization({
                id: '70000000-0000-4000-8000-000000001001',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);

            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            });

            const useCase = new GetOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId },
                { requestId: 'test-request-id', externalId: principalExternalId }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().id).toBe(organization.id);
        });

        it('should return organization for active member', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000A002';
            const memberId = '00000000-0000-4000-8000-00000000A003';
            const organization = createOrganization({
                id: '70000000-0000-4000-8000-000000001002',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            setup.uow.getOrganizationMembershipRepository().addMembership({
                id: '71000000-0000-4000-8000-000000001000',
                organizationId: organization.id,
                userId: memberId,
                roleCode: 'member',
                invitedAt: undefined,
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: null,
                deletedAt: null,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            } as any);

            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            });

            const useCase = new GetOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId },
                { requestId: 'test-request-id', externalId: memberId }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().id).toBe(organization.id);
        });

        it('should return custom fields when toolkit options provided', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            type OrganizationCustom = { category: string };
            // biome-ignore lint/complexity/noBannedTypes: Empty object {} for unused user/membership custom fields
            const toolkitOptions: ToolkitOptions<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const ownerId = '00000000-0000-4000-8000-00000000A007';
            const organization = createOrganization({
                id: '70000000-0000-4000-8000-000000001004',
                ownerUserId: ownerId,
                extra: { category: 'eng' }
            });
            await setup.uow.getOrganizationRepository().insert(organization);

            await setup.uow.getUserRepository().insert({
                id: ownerId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            });

            const useCase = new GetOrganization<OrganizationCustom>(
                adapters as any,
                toolkitOptions
            );
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId },
                { requestId: 'test-request-id', externalId: ownerId }
            );

            expect(result.isSuccess).toBe(true);
            expect((result.getValue() as any).category).toBe('eng');
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when organization does not exist', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-00000000A006';
            const useCase = new GetOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: '70000000-0000-4000-8000-000000009999', principalExternalId },
                { requestId: 'test-request-id', externalId: userId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
        });
    });

    describe('Error Cases - Authorization', () => {
        it('should fail with UNAUTHORIZED for non-member non-owner', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const ownerId = '00000000-0000-4000-8000-00000000A004';
            const outsiderId = '00000000-0000-4000-8000-00000000A005';
            const organization = createOrganization({
                id: '70000000-0000-4000-8000-000000001003',
                ownerUserId: ownerId
            });
            await setup.uow.getOrganizationRepository().insert(organization);
            await setup.uow.getUserRepository().insert({
                id: outsiderId,
                externalId: principalExternalId,
                username: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            });

            const useCase = new GetOrganization(adapters);
            const result = await useCase.execute(
                { organizationId: organization.id, principalExternalId },
                { requestId: 'test-request-id', externalId: outsiderId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('UNAUTHORIZED');
        });
    });
});
