import type { Adapters, ToolkitOptions } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateUser } from '../../src/users/use-cases/create-user/CreateUser';
import { TestData } from '../test-helpers/Builders';
import { createTestSetup } from '../test-helpers/TestUtils';

describe('CreateUser use case', () => {
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
        it('should create a user successfully', async () => {
            const useCase = new CreateUser(adapters);
            const result = await useCase.execute(
                { externalId: 'New@Example.com', username: 'New@Example.com' },
                {
                    requestId: 'test-request-id',
                    externalId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isSuccess).toBe(true);
            const user = result.getValue();
            expect(user.id).toBe('00000000-0000-4000-8000-000000000001');
            expect(user.externalId).toBe('New@Example.com');
            expect(user.username).toBe('New@Example.com');
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);

            // Verify it was saved in the repository
            const fromRepo = await setup.userRepo.findById(user.id);
            expect(fromRepo).toBeDefined();
            expect(fromRepo?.externalId).toBe('New@Example.com');
        });

        it('should create a user with custom fields when toolkit options provided', async () => {
            type Custom = { role: string };
            const toolkitOptions: ToolkitOptions<Custom, any, any> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({ role: require('zod').z.string() })
                    }
                }
            } as any;

            const useCase = new CreateUser<Custom>(adapters as any, toolkitOptions);
            const result = await useCase.execute(
                {
                    externalId: 'custom@example.com',
                    role: 'admin',
                    username: 'custom@example.com'
                },
                {
                    requestId: 'test-request-id',
                    externalId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isSuccess).toBe(true);
            const user = result.getValue() as any;
            expect(user.role).toBe('admin');
            expect(user.username).toBe('custom@example.com');
        });
    });

    describe('Error Cases - Validation', () => {
        it('should fail with CONFLICT when externalId already exists', async () => {
            const existing = TestData.user().build();
            await setup.userRepo.insert(existing);

            const useCase = new CreateUser(adapters);
            const result = await useCase.execute(
                { externalId: '00000001-0000-4000-8000-000000010001', username: 'username' },
                {
                    requestId: 'test-request-id',
                    externalId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            const error = result.getError();
            expect(error.code).toBe('CONFLICT');
        });

        it('should fail with VALIDATION_ERROR when required custom field is missing', async () => {
            type Custom = { role: string };
            const toolkitOptions: ToolkitOptions<Custom, any, any> = {
                users: {
                    customFields: {
                        // role is required on output validation
                        customSchema: require('zod').z.object({ role: require('zod').z.string() })
                    }
                }
            } as any;

            const useCase = new CreateUser<Custom>(adapters as any, toolkitOptions);
            // We intentionally omit role in input; input schema allows partial, but output validation requires it
            const result = await useCase.execute({ email: 'missingrole@example.com' } as any, {
                requestId: 'test-request-id',
                externalId: '00000000-0000-4000-8000-000000000000'
            });

            expect(result.isFailure).toBe(true);
            const error = result.getError();
            expect(error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Error Cases - Persistence', () => {
        it('should wrap transaction errors as VALIDATION_ERROR', async () => {
            // Force the Unit of Work to throw
            (setup.uow as any).setTransactionError(new Error('db fail'));

            const useCase = new CreateUser(adapters);
            const result = await useCase.execute(
                { externalId: 'txerror@example.com', username: 'username' },
                {
                    requestId: 'test-request-id',
                    externalId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            const error = result.getError();
            expect(error.code).toBe('VALIDATION_ERROR');
        });
    });
});
