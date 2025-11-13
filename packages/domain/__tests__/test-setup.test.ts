import { describe, it, expect, beforeEach } from 'vitest';
import { createTestSetup, TestAssertions, TestScenarios } from './test-helpers/TestUtils';
import { TestData } from './test-helpers/Builders';
import { FixedClock, DeterministicUuid } from './test-helpers/TestDoubles';

describe('Test Infrastructure', () => {
    let setup: ReturnType<typeof createTestSetup>;

    beforeEach(() => {
        setup = createTestSetup();
    });

    describe('Test Doubles', () => {
        it('should provide fixed clock', () => {
            const clock = new FixedClock(new Date('2025-01-15T12:00:00.000Z'));
            expect(clock.now()).toEqual(new Date('2025-01-15T12:00:00.000Z'));
        });

        it('should provide deterministic UUID generator', () => {
            const uuid = new DeterministicUuid();
            expect(uuid.generate()).toBe('00000000-0000-4000-8000-000000000001');
            expect(uuid.generate()).toBe('00000000-0000-4000-8000-000000000002');

            uuid.reset();
            expect(uuid.generate()).toBe('00000000-0000-4000-8000-000000000001');
        });
    });

    describe('Builders', () => {
        it('should build user with defaults', () => {
            const user = TestData.user().build();
            expect(user.id).toBe('00000001-0000-4000-8000-000000010000');
            expect(user.externalId).toBe('00000001-0000-4000-8000-000000010001');
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
            expect(user.deletedAt).toBeUndefined();
        });

        it('should build user with custom values', () => {
            const customCreated = new Date('2025-02-01T00:00:00.000Z');
            const customUpdated = new Date('2025-02-02T00:00:00.000Z');

            const user = TestData.user()
                .withId('00000004-0000-4000-8000-000000040000')
                .withExternalId('custom@test.com')
                .withCreatedAt(customCreated)
                .withUpdatedAt(customUpdated)
                .withDeletedAt(undefined)
                .build();

            expect(user.id).toBe('00000004-0000-4000-8000-000000040000');
            expect(user.externalId).toBe('custom@test.com');
            expect(user.createdAt).toEqual(customCreated);
            expect(user.updatedAt).toEqual(customUpdated);
            expect(user.deletedAt).toBeUndefined();
        });

        it('should build user with custom fields via framework config', () => {
            const frameworkConfig = {
                users: {
                    customFields: {
                        // Provide a simple custom schema with one field
                        customSchema: require('zod').z.object({ role: require('zod').z.string() })
                    }
                }
            } as any;

            const user = TestData.user<{ role: string }>()
                .withCustomFields({ role: 'admin' })
                .build(frameworkConfig);

            expect(user.role).toBe('admin');
        });

        it('should build principal with defaults', () => {
            const principal = TestData.principal().build();
            // Principal now only has authProviderId (auth provider user ID)
            expect(principal.authProviderId).toBe('00000001-0000-4000-8000-000000010001');
        });
    });

    describe('Fake Repositories', () => {
        it('should save and retrieve user', async () => {
            const user = TestData.user().build();
            await setup.userRepo.insert(user);

            const retrieved = await setup.userRepo.findById(user.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(user.id);
        });
    });

    describe('Test Scenarios', () => {
        it('should setup basic scenario', async () => {
            const scenario = await TestScenarios.basic(setup);

            expect(scenario.owner).toBeDefined();
            expect(scenario.admin).toBeDefined();
            expect(scenario.member).toBeDefined();

            // Verify data was saved to repositories
            const ownerFromRepo = await setup.userRepo.findById(
                '00000005-0000-4000-8000-000000050000'
            );
            expect(ownerFromRepo).toBeDefined();
        });
    });

    describe('Test Assertions', () => {
        it('should assert success result', () => {
            const successResult = {
                isSuccess: true,
                isFailure: false,
                getValue: () => 'success value'
            };
            const value = TestAssertions.expectSuccess(successResult);
            expect(value).toBe('success value');
        });

        it('should assert failure result', () => {
            const failureResult = {
                isSuccess: false,
                isFailure: true,
                getError: () => ({ code: 'TEST_ERROR', message: 'Test error' })
            };
            const error = TestAssertions.expectFailure(failureResult, 'TEST_ERROR');
            expect(error.code).toBe('TEST_ERROR');
            expect(error.message).toBe('Test error');
        });

        it('should assert array length', () => {
            const array = [1, 2, 3];
            const result = TestAssertions.expectArrayLength(array, 3);
            expect(result).toBe(array);
        });

        it('should assert defined value', () => {
            const value = 'test';
            const result = TestAssertions.expectDefined(value);
            expect(result).toBe('test');
        });
    });

    describe('Unit of Work', () => {
        it('should execute transaction with repository bundle', async () => {
            let reposReceived: any = null;

            await setup.uow.transaction(async (repos) => {
                reposReceived = repos;
                return 'success';
            });

            expect(reposReceived).toBeDefined();
            expect(reposReceived.users).toBe(setup.userRepo);
        });
    });
});
