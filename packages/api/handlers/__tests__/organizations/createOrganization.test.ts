import type { FrameworkConfig, UseCases } from '@multitenantkit/domain-contracts';
import { createPrincipal } from '@multitenantkit/domain-contracts/shared/auth/Principal';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createOrganizationHandlerPackage,
    createOrganizationRoute,
    makeCreateOrganizationHandler
} from '../../src/organizations/create-organization/createOrganization';

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

describe('CreateOrganization Handler', () => {
    let mockUseCases: UseCases;
    let mockCreateOrganizationExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create mock for createOrganization use case
        mockCreateOrganizationExecute = vi.fn();

        mockUseCases = {
            organizations: {
                createOrganization: {
                    execute: mockCreateOrganizationExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(createOrganizationRoute.method).toBe('POST');
            expect(createOrganizationRoute.path).toBe('/organizations');
            expect(createOrganizationRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 201 with organization data when use case succeeds', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000001';
            const organizationId = '00000000-0000-4000-8000-111111111111';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    body: {}
                },
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data).toEqual({
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            });
            expect(response.headers).toEqual({
                Location: `/organizations/${organizationId}`,
                'X-Request-ID': 'req-123'
            });

            // Verify use case was called correctly
            expect(mockCreateOrganizationExecute).toHaveBeenCalledWith(
                { principalExternalId },
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'CREATE_ORGANIZATION'
                })
            );
        });

        it('should include Location header with organization ID', async () => {
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

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    body: {}
                },
                principal,
                requestId: 'req-location'
            });

            expect(response.headers?.Location).toBe(`/organizations/${organizationId}`);
        });

        it('should support custom fields when framework config provided', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000003';
            const organizationId = '00000000-0000-4000-8000-333333333333';

            type OrganizationCustom = { description: string };
            const frameworkConfig: FrameworkConfig<undefined, OrganizationCustom, undefined> = {
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

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeCreateOrganizationHandler(mockUseCases, frameworkConfig);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    body: {
                        description: 'My awesome organization'
                    } as any // Cast needed because description is a custom field
                },
                principal,
                requestId: 'req-custom'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data.description).toBe('My awesome organization');
        });

        it('should use createdAt for updatedAt on new organizations', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000004';
            const organizationId = '00000000-0000-4000-8000-444444444444';
            const createdAt = new Date('2025-01-15T10:30:00.000Z');
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt,
                updatedAt: new Date('2025-01-15T10:30:00.000Z'), // Same as createdAt initially
                deletedAt: undefined
            };

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    body: {}
                },
                principal,
                requestId: 'req-timestamps'
            });

            expect(response.status).toBe(201);
            const body = (response.body as any).data;
            expect(body.createdAt).toEqual(new Date('2025-01-15T10:30:00.000Z'));
            expect(body.updatedAt).toEqual(new Date('2025-01-15T10:30:00.000Z'));
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const handler = makeCreateOrganizationHandler(mockUseCases);

            const response = await handler({
                input: {
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
            expect(mockCreateOrganizationExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Use Case Failures', () => {
        it('should return 400 for validation errors', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const validationError = new ValidationError('Invalid owner user ID', 'ownerUserId');
            mockCreateOrganizationExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
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
                    message: 'Invalid owner user ID',
                    details: {
                        field: 'ownerUserId'
                    },
                    requestId: 'req-validation'
                }
            });
        });
    });

    describe('Error Cases - Unexpected Errors', () => {
        it('should return 500 for unexpected errors in use case', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            mockCreateOrganizationExecute.mockRejectedValue(new Error('Database connection lost'));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
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
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000007';
            const organizationId = 'invalid-uuid';
            // Return data that doesn't match schema (invalid UUID)
            const invalidOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(invalidOrganization));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
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
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            type OrganizationCustom = { description: string };
            const frameworkConfig: FrameworkConfig<undefined, OrganizationCustom, undefined> = {
                organizations: {
                    customFields: {
                        customSchema: require('zod').z.object({
                            description: require('zod').z.string()
                        })
                    }
                }
            } as any;

            const handler = makeCreateOrganizationHandler(mockUseCases, frameworkConfig);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    body: {
                        description: 123 // Invalid type (should be string)
                    } as any // Cast needed to test invalid custom field
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
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000009';
            const organizationId = '00000000-0000-4000-8000-999999999999';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    body: {}
                },
                principal,
                requestId: ''
            });

            expect(response.status).toBe(201);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle organization with null deletedAt explicitly', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000010';
            const organizationId = '00000000-0000-4000-8000-101010101010';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: null
            };

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization as any));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    body: {}
                },
                principal,
                requestId: 'req-null-deleted'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).deletedAt).toBe(undefined);
        });

        it('should handle organization with deletedAt date', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000012';
            const organizationId = '00000000-0000-4000-8000-121212121212';
            const deletedAt = new Date('2025-03-01T12:00:00.000Z');
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-02-01T00:00:00.000Z'),
                deletedAt
            };

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    body: {}
                },
                principal,
                requestId: 'req-with-deleted'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data.deletedAt).toEqual(
                new Date('2025-03-01T12:00:00.000Z')
            );
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000011';
            const organizationId = '00000000-0000-4000-8000-111111111110';
            const mockOrganization = {
                id: organizationId,
                ownerUserId: userId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            };

            mockCreateOrganizationExecute.mockResolvedValue(mockResult.ok(mockOrganization));

            const handler = makeCreateOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            await handler({
                input: {
                    body: {}
                },
                principal,
                requestId: 'req-audit'
            });

            // Verify operation context was built correctly
            expect(mockCreateOrganizationExecute).toHaveBeenCalledWith(
                { principalExternalId },
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'CREATE_ORGANIZATION'
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = createOrganizationHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(createOrganizationRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should create handler package with framework config', () => {
            const frameworkConfig: FrameworkConfig<undefined, { description: string }, undefined> =
                {
                    organizations: {
                        customFields: {
                            customSchema: require('zod').z.object({
                                description: require('zod').z.string()
                            })
                        }
                    }
                } as any;

            const handlerPackage = createOrganizationHandlerPackage(mockUseCases, frameworkConfig);

            expect(handlerPackage).toHaveProperty('handler');
            expect(handlerPackage).toHaveProperty('schema');
            expect(typeof handlerPackage.handler).toBe('function');

            // Should have extended schema with custom fields
            expect(handlerPackage.schema).toBeDefined();
        });

        it('should use CreateOrganizationRequestSchema when no custom fields', () => {
            const handlerPackage = createOrganizationHandlerPackage(mockUseCases);

            // Verify schema structure
            expect(handlerPackage.schema).toHaveProperty('shape');
            expect(handlerPackage.schema.shape).toHaveProperty('body');
        });
    });
});
