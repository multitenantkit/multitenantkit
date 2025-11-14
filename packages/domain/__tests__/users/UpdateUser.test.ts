import type { Adapters, FrameworkConfig } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateUser } from '../../src/users/use-cases/update-user/UpdateUser';
import { TestData } from '../test-helpers/Builders';
import { createTestSetup } from '../test-helpers/TestUtils';

describe('UpdateUser use case', () => {
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
        it('should update custom fields when framework config provided', async () => {
            type Custom = { role?: string };
            const frameworkConfig: FrameworkConfig<Custom, any, any> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            role: require('zod').z.string().optional()
                        })
                    }
                }
            } as any;

            const existing = TestData.user<Custom>()
                .withCustomFields({ role: 'member' })
                .build(frameworkConfig);
            await setup.userRepo.insert(existing as any);

            const useCase = new UpdateUser<Custom>(adapters as any, frameworkConfig);
            const result = await useCase.execute(
                {
                    principalExternalId: existing.externalId,
                    role: 'admin'
                },
                { requestId: 'test-request-id', actorUserId: existing.externalId }
            );

            expect(result.isSuccess).toBe(true);
            const out = result.getValue();
            expect(out.role).toBe('admin');
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with NOT_FOUND when user does not exist', async () => {
            const useCase = new UpdateUser(adapters);
            // Pass an externalId that doesn't exist
            const nonExistentExternalId = '11111111-1111-4111-8111-111111111111';
            const result = await useCase.execute(
                { principalExternalId: nonExistentExternalId }, // userId is externalId
                {
                    requestId: 'test-request-id',
                    actorUserId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('NOT_FOUND');
            expect(result.getError().message).toBe(
                `User with identifier '${nonExistentExternalId}' not found`
            );
        });

        it('should fail with VALIDATION_ERROR when custom schema rejects merged data', async () => {
            // Custom schema requires role to be exactly 'admin'
            type Custom = { role?: string };
            const frameworkConfig: FrameworkConfig<Custom, any, any> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            role: require('zod').z.literal('admin').optional()
                        })
                    }
                }
            } as any;

            // Existing user valid with role 'admin'
            const existing = TestData.user<Custom>()
                .withCustomFields({ role: 'admin' })
                .build(frameworkConfig);
            await setup.userRepo.insert(existing as any);

            // Update attempts to set role to an invalid value per schema
            const useCase = new UpdateUser<Custom>(adapters as any, frameworkConfig);
            const result = await useCase.execute(
                { userId: existing.externalId, email: 'valid@example.com', role: 'member' } as any,
                { requestId: 'test-request-id', actorUserId: existing.externalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });

        it('should fail with VALIDATION_ERROR when only custom field violates schema', async () => {
            type Custom = { role?: string };
            const frameworkConfig: FrameworkConfig<Custom, any, any> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            role: require('zod').z.literal('admin').optional()
                        })
                    }
                }
            } as any;

            const existing = TestData.user<Custom>()
                .withCustomFields({ role: 'admin' })
                .build(frameworkConfig);
            await setup.userRepo.insert(existing as any);

            const useCase = new UpdateUser<Custom>(adapters as any, frameworkConfig);
            // Only updating role to invalid value triggers validation fail on merged data
            const result = await useCase.execute(
                { userId: existing.externalId, role: 'member' } as any,
                {
                    requestId: 'test-request-id',
                    actorUserId: existing.externalId
                }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });

        it('should fail with VALIDATION_ERROR when existing persisted data is invalid (legacy)', async () => {
            // Persist a malformed user (createdAt as string instead of Date)
            const badUser: any = {
                id: '00000000-0000-4000-8000-00000000BAD1',
                externalId: '00000000-0000-4000-8000-00000000BAD2',
                email: 'legacy@example.com',
                createdAt: '2025-01-01T00:00:00.000Z', // invalid type
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };
            await setup.userRepo.insert(badUser as any);

            const useCase = new UpdateUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: badUser.externalId },
                { requestId: 'test-request-id', actorUserId: badUser.externalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            const existing = TestData.user().build();
            await setup.userRepo.insert(existing);

            // Force UoW to throw during transaction
            (setup.uow as any).setTransactionError(new Error('tx failure'));

            const useCase = new UpdateUser(adapters);
            const result = await useCase.execute(
                { principalExternalId: existing.externalId },
                { requestId: 'test-request-id', actorUserId: existing.externalId }
            );

            expect(result.isFailure).toBe(true);
            expect(result.getError().code).toBe('VALIDATION_ERROR');
        });
    });
});
