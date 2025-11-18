import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import { createPrincipal } from '@multitenantkit/domain-contracts/shared/auth/Principal';
import { NotFoundError, ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    makeUpdateUserHandler,
    updateUserHandlerPackage,
    updateUserRoute
} from '../../src/users/update-user/updateUser';

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

type ToolkitOptionsDefault = { email: string };
const toolkitOptionsDefault: ToolkitOptions<ToolkitOptionsDefault, undefined, undefined> = {
    users: {
        customFields: {
            customSchema: require('zod').z.object({
                email: require('zod').z.string().email()
            })
        }
    }
} as any;

describe('UpdateUser Handler', () => {
    let mockUseCases: UseCases;
    let mockUpdateUserExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create mock for updateUser use case
        mockUpdateUserExecute = vi.fn();

        mockUseCases = {
            users: {
                updateUser: {
                    execute: mockUpdateUserExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(updateUserRoute.method).toBe('PATCH');
            expect(updateUserRoute.path).toBe('/users/me');
            expect(updateUserRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 200 with success response when use case succeeds', async () => {
            const userId = '00000000-0000-4000-8000-000000000001';
            const mockOutput = {
                id: userId,
                email: 'updated@example.com',
                externalId: userId,
                username: 'testuser1',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T10:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateUserExecute.mockResolvedValue(mockResult.ok(mockOutput));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'updated@example.com'
                    }
                },
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual(mockOutput);
            expect(response.headers).toEqual({
                'X-Request-ID': 'req-123'
            });

            // Verify use case was called correctly
            expect(mockUpdateUserExecute).toHaveBeenCalledWith(
                {
                    principalExternalId: userId,
                    email: 'updated@example.com'
                },
                expect.objectContaining({
                    actorUserId: userId,
                    auditAction: 'UPDATE_USER_PROFILE'
                })
            );
        });

        it('should include X-Request-ID header in response', async () => {
            const userId = '00000000-0000-4000-8000-000000000002';
            const mockOutput = {
                id: userId,
                email: 'user@example.com',
                externalId: userId,
                username: 'testuser2',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };

            mockUpdateUserExecute.mockResolvedValue(mockResult.ok(mockOutput));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'user@example.com'
                    }
                },
                principal,
                requestId: 'custom-request-id'
            });

            expect(response.headers?.['X-Request-ID']).toBe('custom-request-id');
        });

        it('should support partial updates (email only)', async () => {
            const userId = '00000000-0000-4000-8000-000000000003';
            const mockOutput = {
                id: userId,
                email: 'newemail@example.com',
                externalId: userId,
                username: 'testuser3',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };

            mockUpdateUserExecute.mockResolvedValue(mockResult.ok(mockOutput));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'newemail@example.com'
                    }
                },
                principal,
                requestId: 'req-partial'
            });

            expect(response.status).toBe(200);
            expect(mockUpdateUserExecute).toHaveBeenCalledWith(
                {
                    principalExternalId: userId,
                    email: 'newemail@example.com'
                },
                expect.any(Object)
            );
        });

        it('should support custom fields when toolkit options provided', async () => {
            const userId = '00000000-0000-4000-8000-000000000004';
            type UserCustom = { email: string; bio: string };
            const toolkitOptions: ToolkitOptions<UserCustom, undefined, undefined> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            email: require('zod').z.string().email(),
                            bio: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const mockOutput = {
                id: userId,
                email: 'user@example.com',
                bio: 'Updated bio',
                externalId: userId,
                username: 'customuser',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };

            mockUpdateUserExecute.mockResolvedValue(mockResult.ok(mockOutput));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptions);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'user@example.com',
                        bio: 'Updated bio'
                    } as any // Cast needed because bio is a custom field
                },
                principal,
                requestId: 'req-custom'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.bio).toBe('Updated bio');
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);

            const response = await handler({
                input: {
                    body: {
                        email: 'user@example.com'
                    }
                },
                principal: undefined,
                requestId: 'req-no-auth'
            });

            expect(response.status).toBe(400);
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
            expect(mockUpdateUserExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Use Case Failures', () => {
        it('should return 404 when user not found', async () => {
            const userId = '00000000-0000-4000-8000-000000000999';
            const notFoundError = new NotFoundError('User', userId);
            mockUpdateUserExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'user@example.com'
                    }
                },
                principal,
                requestId: 'req-not-found'
            });

            expect(response.status).toBe(404);
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'NOT_FOUND',
                    message: `User with identifier '${userId}' not found`,
                    details: {
                        resource: 'User',
                        identifier: userId
                    },
                    requestId: 'req-not-found'
                }
            });
            expect(response.headers?.['X-Request-ID']).toBe('req-not-found');
        });

        it('should return 400 for validation errors', async () => {
            const userId = '00000000-0000-4000-8000-000000000005';
            const validationError = new ValidationError('Invalid email format', 'email');
            mockUpdateUserExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'invalid-email'
                    }
                },
                principal,
                requestId: 'req-validation'
            });

            expect(response.status).toBe(400);
        });
    });

    describe('Error Cases - Unexpected Errors', () => {
        it('should return 500 for unexpected errors in use case', async () => {
            const userId = '00000000-0000-4000-8000-000000000006';
            mockUpdateUserExecute.mockRejectedValue(new Error('Database connection lost'));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'user@example.com'
                    }
                },
                principal,
                requestId: 'req-unexpected'
            });

            expect(response.status).toBe(500);
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
            const userId = '00000000-0000-4000-8000-000000000007';
            // Return data that doesn't match schema (missing required fields)
            const invalidOutput = {
                data: { id: userId, email: 'user@example.com' }
                // missing required fields like 'createdAt', 'updatedAt'
            };

            mockUpdateUserExecute.mockResolvedValue(mockResult.ok(invalidOutput));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'user@example.com'
                    }
                },
                principal,
                requestId: 'req-parse-error'
            });

            // Now correctly returns 400 (ValidationError) instead of 500
            // because validateWithSchemaSync properly handles schema validation errors
            expect(response.status).toBe(400);
            expect((response.body as any).error.code).toBe('VALIDATION_ERROR');
            expect((response.body as any).error.message).toBe('Invalid response data');
        });

        it('should handle custom schema parsing errors', async () => {
            const userId = '00000000-0000-4000-8000-000000000008';
            type UserCustom = { bio: string };
            const toolkitOptions: ToolkitOptions<UserCustom, undefined, undefined> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            bio: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptions);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'user@example.com',
                        bio: 123 // Invalid type (should be string)
                    } as any // Cast needed to test invalid custom field
                },
                principal,
                requestId: 'req-custom-parse-error'
            });

            expect(response.status).toBe(400);
            expect((response.body as any).error.code).toEqual('VALIDATION_ERROR');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const userId = '00000000-0000-4000-8000-000000000009';
            const mockOutput = {
                id: userId,
                email: 'user@example.com',
                externalId: userId,
                username: 'testuser9',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };

            mockUpdateUserExecute.mockResolvedValue(mockResult.ok(mockOutput));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {
                        email: 'user@example.com'
                    }
                },
                principal,
                requestId: ''
            });

            expect(response.status).toBe(200);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle update with empty body (all fields optional)', async () => {
            const userId = '00000000-0000-4000-8000-000000000010';
            const mockOutput = {
                id: userId,
                email: 'unchanged@example.com',
                externalId: userId,
                username: 'testuser10',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };

            mockUpdateUserExecute.mockResolvedValue(mockResult.ok(mockOutput));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            const response = await handler({
                input: {
                    body: {} as any // Cast needed for empty body test
                },
                principal,
                requestId: 'req-empty-body'
            });

            expect(response.status).toBe(200);
            expect(mockUpdateUserExecute).toHaveBeenCalledWith(
                {
                    principalExternalId: userId
                },
                expect.any(Object)
            );
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const userId = '00000000-0000-4000-8000-000000000011';
            const mockOutput = {
                id: userId,
                email: 'audit@example.com',
                externalId: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUpdateUserExecute.mockResolvedValue(mockResult.ok(mockOutput));

            const handler = makeUpdateUserHandler(mockUseCases, toolkitOptionsDefault);
            const principal = createPrincipal(userId);

            await handler({
                input: {
                    body: {
                        email: 'audit@example.com'
                    }
                },
                principal,
                requestId: 'req-audit'
            });

            // Verify operation context was built correctly
            expect(mockUpdateUserExecute).toHaveBeenCalledWith(
                expect.objectContaining({
                    principalExternalId: userId,
                    email: 'audit@example.com'
                }),
                expect.objectContaining({
                    actorUserId: userId,
                    auditAction: 'UPDATE_USER_PROFILE'
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = updateUserHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(updateUserRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should create handler package with toolkit options', () => {
            const toolkitOptions: ToolkitOptions<{ bio: string }, undefined, undefined> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            bio: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handlerPackage = updateUserHandlerPackage(mockUseCases, toolkitOptions);

            expect(handlerPackage).toHaveProperty('handler');
            expect(handlerPackage).toHaveProperty('schema');
            expect(typeof handlerPackage.handler).toBe('function');

            // Should have extended schema with custom fields
            expect(handlerPackage.schema).toBeDefined();
        });

        it('should use UpdateUserRequestSchema when no custom fields', () => {
            const handlerPackage = updateUserHandlerPackage(mockUseCases);

            // Verify schema structure
            expect(handlerPackage.schema).toHaveProperty('shape');
            expect(handlerPackage.schema.shape).toHaveProperty('body');
        });

        it('should enforce at least one field requirement with custom fields', () => {
            const toolkitOptions: ToolkitOptions<{ bio: string }, undefined, undefined> = {
                users: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            bio: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handlerPackage = updateUserHandlerPackage(mockUseCases, toolkitOptions);

            // Try to parse empty body - should fail validation
            const result = handlerPackage.schema.safeParse({ body: {} });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'At least one field must be provided for update'
                );
            }
        });
    });
});
