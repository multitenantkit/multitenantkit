import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import { createPrincipal } from '@multitenantkit/domain-contracts/shared/auth/Principal';
import {
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    makeUpdateOrganizationHandler,
    updateOrganizationHandlerPackage,
    updateOrganizationRoute
} from '../../src/organizations/update-organization/updateOrganization';

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

describe('UpdateOrganization Handler', () => {
    let mockUseCases: UseCases;
    let mockUpdateOrganizationExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create mock for updateOrganization use case
        mockUpdateOrganizationExecute = vi.fn();

        mockUseCases = {
            organizations: {
                updateOrganization: {
                    execute: mockUpdateOrganizationExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(updateOrganizationRoute.method).toBe('PATCH');
            expect(updateOrganizationRoute.path).toBe('/organizations/:id');
            expect(updateOrganizationRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 200 with updated organization data when use case succeeds', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-111111111111';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual({
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            });
            expect(response.headers?.['X-Request-ID']).toBe('req-123');

            // Verify use case was called correctly
            expect(mockUpdateOrganizationExecute).toHaveBeenCalledWith(
                { organizationId, principalExternalId },
                expect.objectContaining({
                    externalId: principalExternalId,
                    auditAction: 'UPDATE_ORGANIZATION',
                    organizationId
                })
            );
        });

        it('should include X-Request-ID in response headers', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-222222222222';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-header-test'
            });

            expect(response.headers?.['X-Request-ID']).toBe('req-header-test');
        });

        it('should support custom fields when toolkit options provided', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-333333333333';

            type OrganizationCustom = { description: string };
            const toolkitOptions: ToolkitOptions<undefined, OrganizationCustom, undefined> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            description: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                description: 'Updated description',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases, toolkitOptions);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {
                        description: 'Updated description'
                    } as any
                },
                principal,
                requestId: 'req-custom'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.description).toBe('Updated description');
        });

        it('should handle partial updates (only some fields)', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-444444444444';

            type OrganizationCustom = { description: string; category: string };
            const toolkitOptions: ToolkitOptions<undefined, OrganizationCustom, undefined> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            description: require('zod').z.string(),
                            category: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                description: 'Updated description',
                category: 'Engineering', // Original value
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases, toolkitOptions);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {
                        description: 'Updated description'
                        // category not provided - partial update
                    } as any
                },
                principal,
                requestId: 'req-partial'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.description).toBe('Updated description');
            expect((response.body as any).data.category).toBe('Engineering');
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const organizationId = '00000000-0000-4000-8000-555555555555';
            const handler = makeUpdateOrganizationHandler(mockUseCases);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
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
            expect(mockUpdateOrganizationExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Authorization', () => {
        it('should return 401 when user is not authorized to update organization', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const organizationId = '00000000-0000-4000-8000-666666666666';
            const unauthorizedError = new UnauthorizedError(
                'Not authorized to update this organization'
            );
            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.fail(unauthorizedError));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-unauthorized'
            });

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({
                error: {
                    code: 'UNAUTHORIZED',
                    message: expect.stringContaining('Not authorized to update this organization')
                }
            });
        });
    });

    describe('Error Cases - Validation', () => {
        it('should return 404 when organization not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const organizationId = '00000000-0000-4000-8000-777777777777';
            const notFoundError = new NotFoundError('Organization', organizationId);
            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-not-found'
            });

            expect(response.status).toBe(404);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'NOT_FOUND',
                    message: `Organization with identifier '${organizationId}' not found`,
                    details: {
                        resource: 'Organization',
                        identifier: organizationId
                    },
                    requestId: 'req-not-found'
                }
            });
        });

        it('should return 400 for validation errors', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000008';
            const organizationId = '00000000-0000-4000-8000-888888888888';
            const validationError = new ValidationError(
                'Invalid organization ID',
                'organizationId'
            );
            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-validation'
            });

            expect(response.status).toBe(400);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid organization ID',
                    details: {
                        field: 'organizationId'
                    },
                    requestId: 'req-validation'
                }
            });
        });
    });

    describe('Error Cases - Unexpected Errors', () => {
        it('should return 500 for unexpected errors in use case', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000009';
            const organizationId = '00000000-0000-4000-8000-999999999999';
            mockUpdateOrganizationExecute.mockRejectedValue(new Error('Database connection lost'));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
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
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-101010101010';
            // Return data that doesn't match schema (invalid UUID)
            const invalidOrganization = {
                id: 'invalid-uuid',
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(invalidOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
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

        it('should handle custom schema parsing errors', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000011';
            const organizationId = '00000000-0000-4000-8000-111111111110';
            type OrganizationCustom = { description: string };
            const toolkitOptions: ToolkitOptions<undefined, OrganizationCustom, undefined> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            description: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handler = makeUpdateOrganizationHandler(mockUseCases, toolkitOptions);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {
                        description: 123 // Invalid type (should be string)
                    } as any
                },
                principal,
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
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-121212121212';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: ''
            });

            expect(response.status).toBe(200);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle organization with null deletedAt explicitly', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-131313131313';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: null
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization as any));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-null-deleted'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).deletedAt).toBe(undefined);
        });

        it('should handle organization with deletedAt date', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-141414141414';
            const deletedAt = new Date('2025-03-01T12:00:00.000Z');
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-with-deleted'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.deletedAt).toEqual(
                new Date('2025-03-01T12:00:00.000Z')
            );
        });

        it('should handle empty body for update', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-151515151515';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-empty-body'
            });

            expect(response.status).toBe(200);
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit with organizationId', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000016';
            const organizationId = '00000000-0000-4000-8000-161616161616';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockUpdateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeUpdateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            await handler({
                input: {
                    params: { id: organizationId },
                    body: {}
                },
                principal,
                requestId: 'req-audit'
            });

            // Verify operation context was built correctly
            expect(mockUpdateOrganizationExecute).toHaveBeenCalledWith(
                { organizationId, principalExternalId: principalExternalId },
                expect.objectContaining({
                    externalId: principalExternalId,
                    auditAction: 'UPDATE_ORGANIZATION',
                    organizationId
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = updateOrganizationHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(updateOrganizationRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should create handler package with toolkit options', () => {
            const toolkitOptions: ToolkitOptions<undefined, { description: string }, undefined> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            description: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handlerPackage = updateOrganizationHandlerPackage(mockUseCases, toolkitOptions);

            expect(handlerPackage).toHaveProperty('handler');
            expect(handlerPackage).toHaveProperty('schema');
            expect(typeof handlerPackage.handler).toBe('function');

            // Should have extended schema with custom fields
            expect(handlerPackage.schema).toBeDefined();
        });

        it('should use UpdateOrganizationRequestSchema when no custom fields', () => {
            const handlerPackage = updateOrganizationHandlerPackage(mockUseCases);

            // Verify schema structure
            expect(handlerPackage.schema).toHaveProperty('shape');
            expect(handlerPackage.schema.shape).toHaveProperty('body');
            expect(handlerPackage.schema.shape).toHaveProperty('params');
        });

        it('should validate at least one field when custom fields are configured', () => {
            const toolkitOptions: ToolkitOptions<undefined, { description: string }, undefined> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            description: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handlerPackage = updateOrganizationHandlerPackage(mockUseCases, toolkitOptions);

            // Test the refine validation
            const result = handlerPackage.schema.safeParse({
                params: { id: '00000000-0000-4000-8000-171717171717' },
                body: {} // Empty body should fail validation
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain(
                    'At least one field must be provided for update'
                );
            }
        });
    });
});
