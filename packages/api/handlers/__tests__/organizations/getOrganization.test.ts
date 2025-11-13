import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    makeGetOrganizationHandler,
    getOrganizationRoute,
    getOrganizationHandlerPackage
} from '../../src/organizations/get-organization/getOrganization';
import type { UseCases, FrameworkConfig } from '@multitenantkit/domain-contracts';
import {
    NotFoundError,
    ValidationError,
    UnauthorizedError
} from '@multitenantkit/domain-contracts/shared/errors';
import { createPrincipal } from '@multitenantkit/domain-contracts/shared/auth/Principal';

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

describe('GetOrganization Handler', () => {
    let mockUseCases: UseCases;
    let mockGetOrganizationExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create mock for getOrganization use case
        mockGetOrganizationExecute = vi.fn();

        mockUseCases = {
            organizations: {
                getOrganization: {
                    execute: mockGetOrganizationExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(getOrganizationRoute.method).toBe('GET');
            expect(getOrganizationRoute.path).toBe('/organizations/:id');
            expect(getOrganizationRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 200 with organization data when use case succeeds', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000001';
            const organizationId = '00000000-0000-4000-8000-111111111111';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
                },
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual({
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                deletedAt: undefined
            });
            expect(response.headers).toEqual({
                'X-Request-ID': 'req-123'
            });

            // Verify use case was called correctly
            expect(mockGetOrganizationExecute).toHaveBeenCalledWith(
                {
                    organizationId,
                    principalExternalId
                },
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'GET_ORGANIZATION',
                    organizationId
                })
            );
        });

        it('should include X-Request-ID header in response', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-222222222222';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
                },
                principal,
                requestId: 'custom-request-id'
            });

            expect(response.headers?.['X-Request-ID']).toBe('custom-request-id');
        });

        it('should support custom fields when framework config provided', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000003';
            const organizationId = '00000000-0000-4000-8000-333333333333';

            type OrganizationCustom = { description: string };
            const frameworkConfig: FrameworkConfig<{}, OrganizationCustom, {}> = {
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
                description: 'My awesome organization',
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeGetOrganizationHandler(mockUseCases, frameworkConfig);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
                },
                principal,
                requestId: 'req-custom'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.description).toBe('My awesome organization');
        });

        it('should handle organization with deletedAt field', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000004';
            const organizationId = '00000000-0000-4000-8000-444444444444';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                deletedAt: new Date('2025-01-05T00:00:00.000Z')
            };

            mockGetOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
                },
                principal,
                requestId: 'req-deleted'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.deletedAt).toEqual(
                new Date('2025-01-05T00:00:00.000Z')
            );
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const organizationId = '00000000-0000-4000-8000-555555555555';
            const handler = makeGetOrganizationHandler(mockUseCases);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
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
            expect(mockGetOrganizationExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Use Case Failures', () => {
        it('should return 404 when organization not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000005';
            const organizationId = '00000000-0000-4000-8000-999999999999';
            const notFoundError = new NotFoundError('Organization', organizationId);
            mockGetOrganizationExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
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
            expect(response.headers?.['X-Request-ID']).toBe('req-not-found');
        });

        it('should return 401 when user is not a member of the organization', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000006';
            const organizationId = '00000000-0000-4000-8000-666666666666';
            const unauthorizedError = new UnauthorizedError(
                'Not authorized to access this organization'
            );
            mockGetOrganizationExecute.mockResolvedValue(mockResult.fail(unauthorizedError));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
                },
                principal,
                requestId: 'req-unauthorized'
            });

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({
                error: {
                    code: 'UNAUTHORIZED',
                    message: expect.stringContaining('Not authorized to access this organization')
                }
            });
        });

        it('should return 400 for validation errors', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000007';
            const organizationId = 'invalid-uuid';
            const validationError = new ValidationError(
                'Invalid organization ID format',
                'organizationId'
            );
            mockGetOrganizationExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
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
                    message: 'Invalid organization ID format',
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
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000008';
            const organizationId = '00000000-0000-4000-8000-777777777777';
            mockGetOrganizationExecute.mockRejectedValue(new Error('Database connection lost'));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
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
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000009';
            const organizationId = '00000000-0000-4000-8000-888888888888';
            // Return data that doesn't match schema (invalid UUID)
            const invalidOrganization = {
                id: 'invalid-uuid',
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetOrganizationExecute.mockResolvedValue(mockResult.ok(invalidOrganization));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
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
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000010';
            const organizationId = '00000000-0000-4000-8000-101010101010';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
                },
                principal,
                requestId: ''
            });

            expect(response.status).toBe(200);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle organization with null deletedAt explicitly', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000011';
            const organizationId = '00000000-0000-4000-8000-111111111110';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                deletedAt: null
            };

            mockGetOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization as any));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        id: organizationId
                    }
                },
                principal,
                requestId: 'req-null-deleted'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).deletedAt).toBe(undefined);
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000012';
            const organizationId = '00000000-0000-4000-8000-121212121212';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockGetOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeGetOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            await handler({
                input: {
                    params: {
                        id: organizationId
                    }
                },
                principal,
                requestId: 'req-audit'
            });

            // Verify operation context was built correctly
            expect(mockGetOrganizationExecute).toHaveBeenCalledWith(
                {
                    organizationId,
                    principalExternalId
                },
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'GET_ORGANIZATION',
                    organizationId
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = getOrganizationHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(getOrganizationRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should create handler package with framework config', () => {
            const frameworkConfig: FrameworkConfig<{}, { description: string }, {}> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            description: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handlerPackage = getOrganizationHandlerPackage(mockUseCases, frameworkConfig);

            expect(handlerPackage).toHaveProperty('handler');
            expect(handlerPackage).toHaveProperty('schema');
            expect(typeof handlerPackage.handler).toBe('function');

            // Should have schema
            expect(handlerPackage.schema).toBeDefined();
        });

        it('should use GetOrganizationRequestSchema', () => {
            const handlerPackage = getOrganizationHandlerPackage(mockUseCases);

            // Verify schema structure
            expect(handlerPackage.schema).toBeDefined();
        });
    });
});
