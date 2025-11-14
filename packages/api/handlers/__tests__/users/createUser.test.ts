import type { FrameworkConfig, UseCases } from '@multitenantkit/domain-contracts';
import type { Principal } from '@multitenantkit/domain-contracts/shared/auth/Principal';
import { ConflictError, ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createUserHandlerPackage,
    createUserRoute,
    makeCreateUserHandler
} from '../../src/users/create-user/createUser';

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

describe('CreateUser Handler', () => {
    let mockUseCases: UseCases;
    let mockCreateUserExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create mock for createUser use case
        mockCreateUserExecute = vi.fn();

        mockUseCases = {
            users: {
                createUser: {
                    execute: mockCreateUserExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(createUserRoute.method).toBe('POST');
            expect(createUserRoute.path).toBe('/users');
            expect(createUserRoute.auth).toBe('none');
        });
    });

    describe('Happy Path', () => {
        it('should return 201 with user data when use case succeeds', async () => {
            const userId = '00000000-0000-4000-8000-000000000001';
            const externalId = '00000000-0000-4000-8000-000000000101'; // Auth provider ID
            const mockUser = {
                id: userId,
                externalId, // Auth provider user ID
                username: 'testuser1',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'newuser@example.com',
                        username: 'testuser1'
                    }
                },
                principal: undefined,
                requestId: 'req-123'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data).toEqual(mockUser);
            expect(response.headers).toEqual({
                Location: `/users/${userId}`,
                'X-Request-ID': 'req-123'
            });

            // Verify use case was called correctly
            expect(mockCreateUserExecute).toHaveBeenCalledWith(
                { externalId: 'newuser@example.com', username: 'testuser1' },
                expect.objectContaining({
                    auditAction: 'CREATE_USER'
                })
            );
        });

        it('should include Location header with user ID', async () => {
            const userId = '00000000-0000-4000-8000-000000000002';
            const externalId = '00000000-0000-4000-8000-000000000102';
            const mockUser = {
                id: userId,
                externalId,
                username: 'testuser2',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'user@example.com',
                        username: 'testuser2'
                    }
                },
                principal: undefined,
                requestId: 'req-location'
            });

            expect(response.headers?.Location).toBe(`/users/${userId}`);
        });

        it('should work without principal (public endpoint)', async () => {
            const userId = '00000000-0000-4000-8000-000000000003';
            const externalId = '00000000-0000-4000-8000-000000000103';
            const mockUser = {
                id: userId,
                externalId,
                username: 'publicuser',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'public@example.com',
                        username: 'publicuser'
                    }
                },
                principal: undefined,
                requestId: 'req-public'
            });

            expect(response.status).toBe(201);
            expect(mockCreateUserExecute).toHaveBeenCalledWith(
                expect.objectContaining({
                    externalId: 'public@example.com',
                    username: 'publicuser'
                }),
                expect.objectContaining({
                    auditAction: 'CREATE_USER'
                    // Note: actorUserId will be set to a default UUID by buildOperationContext
                })
            );
        });

        it('should support custom fields when framework config provided', async () => {
            const userId = '00000000-0000-4000-8000-000000000004';
            const externalId = '00000000-0000-4000-8000-000000000104';
            type UserCustom = { role: string; email: string };
            const frameworkConfig: FrameworkConfig<UserCustom, undefined, undefined> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            role: require('zod').z.string(),
                            email: require('zod').z.string().email()
                        })
                    }
                }
            } as any;

            const mockUser = {
                id: userId,
                externalId,
                username: 'adminuser',
                email: 'admin@example.com',
                role: 'admin',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases, frameworkConfig);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'admin@example.com',
                        username: 'adminuser',
                        email: 'admin@example.com',
                        role: 'admin'
                    } as any // Type assertion needed for custom fields in test
                },
                principal: undefined,
                requestId: 'req-custom'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data.role).toBe('admin');
        });

        it('should use createdAt for updatedAt on new users', async () => {
            const userId = '00000000-0000-4000-8000-000000000005';
            const externalId = '00000000-0000-4000-8000-000000000105';
            const createdAt = new Date('2025-01-15T10:30:00.000Z');
            const mockUser = {
                id: userId,
                externalId,
                username: 'timestampuser',
                email: 'timestamps@example.com',
                createdAt,
                updatedAt: new Date('2025-01-15T10:30:00.000Z'), // Same as createdAt initially
                deletedAt: undefined
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'timestamps@example.com',
                        username: 'timestampuser'
                    }
                },
                principal: undefined,
                requestId: 'req-timestamps'
            });

            expect(response.status).toBe(201);
            const body = (response.body as any).data;
            expect(body.createdAt).toEqual(createdAt);
            expect(body.updatedAt).toEqual(createdAt);
        });

        it('should return user with both id and externalId fields', async () => {
            const userId = '00000000-0000-4000-8000-000000000006';
            const externalId = '00000000-0000-4000-8000-000000000206'; // Different from internal ID
            const mockUser = {
                id: userId,
                externalId,
                username: 'externaliduser',
                email: 'externalid@example.com',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'externalid@example.com',
                        username: 'externaliduser'
                    }
                },
                principal: undefined,
                requestId: 'req-external-id'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data).toHaveProperty('id', userId);
            expect((response.body as any).data).toHaveProperty('externalId', externalId);
            expect((response.body as any).data.id).not.toBe((response.body as any).data.externalId);
        });
    });

    describe('Error Cases - Use Case Failures', () => {
        it('should return 409 when email already exists', async () => {
            const conflictError = new ConflictError('User', 'user@example.com');
            mockCreateUserExecute.mockResolvedValue(mockResult.fail(conflictError));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'user@example.com',
                        username: 'testuser'
                    }
                },
                principal: undefined,
                requestId: 'req-conflict'
            });

            expect(response.status).toBe(409);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'CONFLICT',
                    message: `User with identifier 'user@example.com' already exists`,
                    details: {
                        resource: 'User',
                        identifier: 'user@example.com'
                    },
                    requestId: 'req-conflict'
                }
            });
            expect(response.headers?.['X-Request-ID']).toBe('req-conflict');
        });

        it('should return 400 for validation errors', async () => {
            const validationError = new ValidationError('Invalid email format', 'email');
            mockCreateUserExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'invalid-email',
                        username: 'invaliduser'
                    }
                },
                principal: undefined,
                requestId: 'req-validation'
            });

            expect(response.status).toBe(400);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid email format',
                    details: {
                        field: 'email'
                    },
                    requestId: 'req-validation'
                }
            });
        });
    });

    describe('Error Cases - Unexpected Errors', () => {
        it('should return 500 for unexpected errors in use case', async () => {
            mockCreateUserExecute.mockRejectedValue(new Error('Database connection lost'));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'user@example.com',
                        username: 'testuser'
                    }
                },
                principal: undefined,
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
            const userId = '00000000-0000-4000-8000-000000000010';
            // Return data that doesn't match schema (missing required field)
            const invalidUser = {
                id: userId,
                // missing externalId
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(invalidUser));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'user@example.com',
                        username: 'testuser'
                    }
                },
                principal: undefined,
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

        it('should handle custom schema parsing errors', async () => {
            type UserCustom = { role: string };
            const frameworkConfig: FrameworkConfig<UserCustom, undefined, undefined> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            role: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handler = makeCreateUserHandler(mockUseCases, frameworkConfig);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'user@example.com',
                        username: 'customuser'
                        // missing required 'role' field
                    }
                },
                principal: undefined,
                requestId: 'req-custom-parse-error'
            });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request body'
                }
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const userId = '00000000-0000-4000-8000-000000000007';
            const externalId = '00000000-0000-4000-8000-000000000107';
            const mockUser = {
                id: userId,
                externalId,
                username: 'testuser',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases);

            const response = await handler({
                input: {
                    body: {
                        externalId: 'user@example.com',
                        username: 'testuser'
                    }
                },
                principal: undefined,
                requestId: ''
            });

            expect(response.status).toBe(201);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle creation with principal (authenticated user creating account)', async () => {
            const userId = '00000000-0000-4000-8000-000000000008';
            const externalId = '00000000-0000-4000-8000-000000000108';
            const authProviderId = '00000000-0000-4000-8000-999999999999'; // Auth provider ID of the actor
            const mockUser = {
                id: userId,
                externalId,
                username: 'testuser',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases);
            const principal: Principal = { authProviderId }; // Updated to use authProviderId

            const response = await handler({
                input: {
                    body: {
                        externalId: 'user@example.com',
                        username: 'testuser'
                    }
                },
                principal,
                requestId: 'req-with-principal'
            });

            expect(response.status).toBe(201);
            expect(mockCreateUserExecute).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({
                    actorUserId: authProviderId // Audit uses authProviderId as actorUserId
                })
            );
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const userId = '00000000-0000-4000-8000-000000000009';
            const externalId = '00000000-0000-4000-8000-000000000109';
            const mockUser = {
                id: userId,
                externalId,
                email: 'audit@example.com',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z')
            };

            mockCreateUserExecute.mockResolvedValue(mockResult.ok(mockUser));

            const handler = makeCreateUserHandler(mockUseCases);

            await handler({
                input: {
                    body: {
                        externalId: 'audit@example.com',
                        username: 'audituser'
                    }
                },
                principal: undefined,
                requestId: 'req-audit'
            });

            // Verify operation context was built correctly
            expect(mockCreateUserExecute).toHaveBeenCalledWith(
                expect.objectContaining({
                    externalId: 'audit@example.com'
                }),
                expect.objectContaining({
                    auditAction: 'CREATE_USER'
                    // Note: actorUserId will be set to a default UUID by buildOperationContext
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = createUserHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(createUserRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should create handler package with framework config', () => {
            const frameworkConfig: FrameworkConfig<{ role: string }, undefined, undefined> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            role: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handlerPackage = createUserHandlerPackage(mockUseCases, frameworkConfig);

            expect(handlerPackage).toHaveProperty('handler');
            expect(handlerPackage).toHaveProperty('schema');
            expect(typeof handlerPackage.handler).toBe('function');

            // Should have extended schema with custom fields
            expect(handlerPackage.schema).toBeDefined();
        });

        it('should use CreateUserRequestSchema when no custom fields', () => {
            const handlerPackage = createUserHandlerPackage(mockUseCases);

            // Verify schema structure
            expect(handlerPackage.schema).toHaveProperty('shape');
            expect(handlerPackage.schema.shape).toHaveProperty('body');
        });
    });
});
