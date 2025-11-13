import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    makeGetUserHandler,
    getUserRoute,
    getUserHandlerPackage
} from '../../src/users/get-user/getUser';
import type { UseCases, FrameworkConfig } from '@multitenantkit/domain-contracts';
import { NotFoundError, ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import type { Principal } from '@multitenantkit/domain-contracts/shared/auth/Principal';

// Helper to create Result-like objects for mocking
const mockResult = {
    ok: <T>(value: T) => ({
        isSuccess: true,
        isFailure: false,
        getValue: () => value,
        getError: () => {
            throw new Error('Cannot get error from success result');
        }
    }),
    fail: <E>(error: E) => ({
        isSuccess: false,
        isFailure: true,
        getValue: () => {
            throw new Error('Cannot get value from failure result');
        },
        getError: () => error
    })
};

describe('GetUser Handler', () => {
    let mockUseCases: UseCases;
    let mockGetUserExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create mock for getUser use case
        mockGetUserExecute = vi.fn();

        mockUseCases = {
            users: {
                getUser: {
                    execute: mockGetUserExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(getUserRoute.method).toBe('GET');
            expect(getUserRoute.path).toBe('/users/me');
            expect(getUserRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 200 with user data when use case succeeds', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000001';
            const mockUser = {
                id: '00000000-0000-4000-8000-000000000101', // Internal user ID
                externalId: authProviderId, // Auth provider ID
                username: 'testuser',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual(mockUser);
            expect(response.headers).toEqual({
                'X-Request-ID': 'req-123'
            });

            // Verify use case was called correctly with authProviderId (maps to User.externalId)
            expect(mockGetUserExecute).toHaveBeenCalledWith(
                { principalExternalId: authProviderId }, // userId in DTO is actually externalId
                expect.objectContaining({
                    actorUserId: authProviderId
                })
            );
        });

        it('should include X-Request-ID header in response', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000002';
            const mockUser = {
                id: '00000000-0000-4000-8000-000000000102',
                externalId: authProviderId,
                username: 'testuser2',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: 'custom-request-id'
            });

            expect(response.headers?.['X-Request-ID']).toBe('custom-request-id');
        });

        it('should support custom fields when framework config provided', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000003';
            type UserCustom = { role: string };
            const frameworkConfig: FrameworkConfig<UserCustom, {}, {}> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            role: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const mockUser = {
                id: '00000000-0000-4000-8000-000000000103',
                externalId: authProviderId,
                username: 'adminuser',
                role: 'admin',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeGetUserHandler(mockUseCases, frameworkConfig);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-custom'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.role).toBe('admin');
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const handler = makeGetUserHandler(mockUseCases);

            const response = await handler({
                input: {},
                principal: undefined,
                requestId: 'req-no-auth'
            });

            expect(response.status).toBe(400);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Authentication is required for this operation',
                    details: {
                        field: 'principal'
                    },
                    requestId: 'req-no-auth'
                }
            });
            expect(response.headers?.['X-Request-ID']).toBe('req-no-auth');

            // Verify use case was NOT called
            expect(mockGetUserExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Use Case Failures', () => {
        it('should return 404 when user not found', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000999';
            const notFoundError = new NotFoundError('User', authProviderId);
            mockGetUserExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-not-found'
            });

            expect(response.status).toBe(404);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'NOT_FOUND',
                    message: `User with identifier '${authProviderId}' not found`,
                    details: {
                        resource: 'User',
                        identifier: authProviderId
                    },
                    requestId: 'req-not-found'
                }
            });
            expect(response.headers?.['X-Request-ID']).toBe('req-not-found');
        });

        it('should return 400 for validation errors', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000004';
            const validationError = new ValidationError('Invalid user ID format', 'userId');
            mockGetUserExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-validation'
            });

            expect(response.status).toBe(400);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid user ID format',
                    details: {
                        field: 'userId'
                    },
                    requestId: 'req-validation'
                }
            });
        });
    });

    describe('Error Cases - Unexpected Errors', () => {
        it('should return 500 for unexpected errors in use case', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000005';
            mockGetUserExecute.mockRejectedValue(new Error('Database connection lost'));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-unexpected'
            });

            expect(response.status).toBe(500);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred',
                    details: {
                        originalMessage: 'Database connection lost'
                    },
                    requestId: 'req-unexpected'
                }
            });
            expect(response.headers?.['X-Request-ID']).toBe('req-unexpected');
        });

        it('should handle errors in schema parsing', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000006';
            // Return data that doesn't match schema (missing required fields)
            const invalidUser = {
                id: '00000000-0000-4000-8000-000000000106',
                // missing externalId and email
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            };

            mockGetUserExecute.mockResolvedValue(mockResult.ok(invalidUser));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-parse-error'
            });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid response data'
                }
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000007';
            const mockUser = {
                id: '00000000-0000-4000-8000-000000000107',
                externalId: authProviderId,
                username: 'testuser7',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: ''
            });

            expect(response.status).toBe(200);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle user with deleted fields', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000008';
            const mockUser = {
                id: '00000000-0000-4000-8000-000000000108',
                externalId: authProviderId,
                username: 'deleteduser',
                deletedAt: new Date('2025-01-01T00:00:00.000Z'),
                createdAt: new Date('2024-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            };

            mockGetUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-deleted'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.deletedAt).toBeDefined();
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const authProviderId = '00000000-0000-4000-8000-000000000009';
            const mockUser = {
                id: '00000000-0000-4000-8000-000000000109',
                externalId: authProviderId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            };

            mockGetUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeGetUserHandler(mockUseCases);
            const principal: Principal = { authProviderId };

            await handler({
                input: {},
                principal,
                requestId: 'req-audit'
            });

            // Verify operation context was built correctly with authProviderId
            expect(mockGetUserExecute).toHaveBeenCalledWith(
                { principalExternalId: authProviderId }, // userId in DTO is actually externalId
                expect.objectContaining({
                    actorUserId: authProviderId, // actorUserId uses authProviderId for audit
                    auditAction: 'GET_USER'
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = getUserHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(getUserRoute);
            expect(handlerPackage.schema).toEqual({});
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should create handler package with framework config', () => {
            const frameworkConfig: FrameworkConfig<{ role: string }, {}, {}> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            role: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handlerPackage = getUserHandlerPackage(mockUseCases, frameworkConfig);

            expect(handlerPackage).toHaveProperty('handler');
            expect(typeof handlerPackage.handler).toBe('function');
        });
    });
});
