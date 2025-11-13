import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrganization } from '../../src/organizations/use-cases/create-organization/CreateOrganization';
import { createTestSetup } from '../test-helpers/TestUtils';
import { type Adapters, type FrameworkConfig } from '@multitenantkit/domain-contracts';

function createOwner(adapters: Adapters, ownerIdProp?: string) {
    const ownerId = '00000000-0000-4000-8000-00000000B001';
    let principalExternalId = '00000000-0000-4000-8000-000000000000';
    if (ownerIdProp) {
        const parts = ownerIdProp.split('-');
        // change last part to AA01
        parts[parts.length - 1] = 'AA01';
        principalExternalId = parts.join('-');
    }
    adapters.persistence.userRepository.insert({
        id: ownerIdProp ?? ownerId,
        externalId: principalExternalId,
        username: principalExternalId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined
    });
    return { principalExternalId, ownerId: ownerIdProp ?? ownerId };
}

describe('CreateOrganization use case', () => {
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
        it('should create a organization and owner membership', async () => {
            const { ownerId, principalExternalId } = createOwner(adapters);
            const useCase = new CreateOrganization(adapters);
            const result = await useCase.execute(
                { principalExternalId },
                { requestId: 'test-request-id', actorUserId: principalExternalId }
            );

            expect(result.isSuccess).toBe(true);
            const organization = result.getValue();
            expect(organization.id).toBe('00000000-0000-4000-8000-000000000001');
            expect(organization.ownerUserId).toBe(ownerId);
            expect(organization.createdAt).toBeInstanceOf(Date);
            expect(organization.updatedAt).toBeInstanceOf(Date);

            // Verify persistence and membership creation
            const saved = await setup.uow.getOrganizationRepository().findById(organization.id);
            expect(saved).toBeDefined();
            // membership repo saved owner membership with organization.id
            expect(setup.uow.getOrganizationMembershipRepository().memberships.size).toBe(1);
        });

        it('should return custom fields when framework config provided', async () => {
            type OrganizationCustom = { category?: string };
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            category: require('zod').z.string().optional()
                        })
                    }
                }
            } as any;

            const { ownerId, principalExternalId } = createOwner(
                adapters,
                '00000000-0000-4000-8000-00000000B002'
            );
            const useCase = new CreateOrganization<{}, OrganizationCustom>(
                adapters as any,
                frameworkConfig
            );
            const result = await useCase.execute({ principalExternalId, category: 'eng' } as any, {
                actorUserId: principalExternalId,
                requestId: 'test-request-id'
            });

            expect(result.isSuccess).toBe(true);
            expect((result.getValue() as any).category).toBe('eng');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            (setup.uow as any).setTransactionError(new Error('persist fail'));
            const { ownerId, principalExternalId } = createOwner(
                adapters,
                '00000000-0000-4000-8000-00000000B003'
            );
            const useCase = new CreateOrganization(adapters);
            const result = await useCase.execute(
                { principalExternalId },
                { requestId: 'test-request-id', actorUserId: principalExternalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });
});
