import { describe, it, expect, beforeEach } from 'vitest';
import { GetUser } from '../../src/users/use-cases/get-user/GetUser';
import { TestData } from '../test-helpers/Builders';
import { createTestSetup } from '../test-helpers/TestUtils';
import { type Adapters, type FrameworkConfig } from '@multitenantkit/domain-contracts';

describe('GetUser use case', () => {
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
        it('should return user by id', async () => {
            const user = TestData.user().build();
            await setup.userRepo.insert(user);

            const useCase = new GetUser(adapters);
            // userId in DTO is actually externalId (auth provider ID)
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', actorUserId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().id).toBe(user.id);
            expect(result.getValue().username).toBe(user.username);
        });

        it('should support custom fields via framework config', async () => {
            type Custom = { role: string };
            const frameworkConfig: FrameworkConfig<Custom, any, any> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({ role: require('zod').z.string() })
                    }
                }
            } as any;

            const user = TestData.user<Custom>()
                .withCustomFields({ role: 'admin' })
                .build(frameworkConfig);
            await setup.userRepo.insert(user as any);

            const useCase = new GetUser<Custom>(adapters as any, frameworkConfig);
            const result = await useCase.execute(
                { principalExternalId: user.externalId },
                { requestId: 'test-request-id', actorUserId: user.externalId }
            );

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().role).toBe('admin');
        });
    });

    describe('Error Cases', () => {
        it('should return NOT_FOUND when user does not exist', async () => {
            const useCase = new GetUser(adapters);
            // Pass an externalId that doesn't exist in the system
            const nonExistentExternalId = '11111111-1111-4111-8111-111111111111';
            const result = await useCase.execute(
                { principalExternalId: nonExistentExternalId }, // userId is actually externalId
                {
                    requestId: 'test-request-id',
                    actorUserId: '00000000-0000-4000-8000-000000000000'
                }
            );

            expect(result.isFailure).toBe(true);
            const error = result.getError();
            expect(error.code).toBe('NOT_FOUND');
            expect(error.message).toContain(
                `User with identifier '${nonExistentExternalId}' not found`
            );
        });
    });
});
