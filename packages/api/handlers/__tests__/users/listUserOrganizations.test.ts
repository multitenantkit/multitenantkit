import type { FrameworkConfig, UseCases } from '@multitenantkit/domain-contracts';
import { createPrincipal } from '@multitenantkit/domain-contracts/shared/auth/Principal';
import { NotFoundError, ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    listUserOrganizationsHandlerPackage,
    listUserOrganizationsRoute,
    makeListUserOrganizationsHandler
} from '../../src/users/list-user-organizations/listUserOrganizations';

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

describe('ListUserOrganizations Handler', () => {
    let mockUseCases: UseCases;
    let mockListUserOrganizationsExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create mock for listUserOrganizations use case
        mockListUserOrganizationsExecute = vi.fn();

        mockUseCases = {
            users: {
                listUserOrganizations: {
                    execute: mockListUserOrganizationsExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(listUserOrganizationsRoute.method).toBe('GET');
            expect(listUserOrganizationsRoute.path).toBe('/users/me/organizations');
            expect(listUserOrganizationsRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 200 with organizations array when use case succeeds', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const organizationId1 = '00000000-0000-4000-8000-111111111111';
            const organizationId2 = '00000000-0000-4000-8000-222222222222';

            const mockOrganizations = [
                {
                    id: organizationId1,
                    ownerUserId: principalExternalId,
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                    deletedAt: undefined
                },
                {
                    id: organizationId2,
                    ownerUserId: principalExternalId,
                    createdAt: new Date('2025-01-03T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-04T00:00:00.000Z'),
                    deletedAt: undefined
                }
            ];

            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok(mockOrganizations));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual([
                {
                    id: organizationId1,
                    ownerUserId: principalExternalId,
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                    deletedAt: undefined
                },
                {
                    id: organizationId2,
                    ownerUserId: principalExternalId,
                    createdAt: new Date('2025-01-03T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-04T00:00:00.000Z'),
                    deletedAt: undefined
                }
            ]);
            expect(response.headers).toEqual({
                'X-Request-ID': 'req-123'
            });

            // Verify use case was called correctly
            expect(mockListUserOrganizationsExecute).toHaveBeenCalledWith(
                { principalExternalId },
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'LIST_USER_ORGANIZATIONS'
                })
            );
        });

        it('should return empty array when user has no organizations', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000002';

            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok([]));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-empty'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual([]);
        });

        it('should include X-Request-ID header in response', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000003';
            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok([]));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'custom-request-id'
            });

            expect(response.headers?.['X-Request-ID']).toBe('custom-request-id');
        });

        it('should handle organizations with deletedAt field', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000004';
            const userId = '00000000-0000-4000-8000-000000000005';
            const organizationId = '00000000-0000-4000-8000-333333333333';

            const mockOrganizations = [
                {
                    id: organizationId,
                    ownerUserId: userId,
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                    deletedAt: new Date('2025-01-05T00:00:00.000Z')
                }
            ];

            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok(mockOrganizations));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-deleted'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data[0].deletedAt).toEqual(
                new Date('2025-01-05T00:00:00.000Z')
            );
        });

        it('should support custom fields when framework config provided', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000005';
            const organizationId = '00000000-0000-4000-8000-444444444444';

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

            const mockOrganizations = [
                {
                    id: organizationId,
                    ownerUserId: principalExternalId,
                    description: 'My awesome organization',
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                    deletedAt: undefined
                }
            ];

            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok(mockOrganizations));

            const handler = makeListUserOrganizationsHandler(mockUseCases, frameworkConfig);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-custom'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data[0].description).toBe('My awesome organization');
        });

        it('should handle single organization', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000006';
            const organizationId = '00000000-0000-4000-8000-555555555555';

            const mockOrganizations = [
                {
                    id: organizationId,
                    ownerUserId: principalExternalId,
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    deletedAt: undefined
                }
            ];

            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok(mockOrganizations));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-single'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toHaveLength(1);
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const handler = makeListUserOrganizationsHandler(mockUseCases);

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
            expect(mockListUserOrganizationsExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Use Case Failures', () => {
        it('should return 404 when user not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000999';
            const notFoundError = new NotFoundError('User', principalExternalId);
            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

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
                    message: `User with identifier '${principalExternalId}' not found`,
                    details: {
                        resource: 'User',
                        identifier: principalExternalId
                    },
                    requestId: 'req-not-found'
                }
            });
            expect(response.headers?.['X-Request-ID']).toBe('req-not-found');
        });

        it('should return 400 for validation errors', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000007';
            const validationError = new ValidationError('Invalid user ID format', 'userId');
            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

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
            const principalExternalId = '00000000-0000-4000-8000-000000000008';
            mockListUserOrganizationsExecute.mockRejectedValue(
                new Error('Database connection lost')
            );

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

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
            const principalExternalId = '00000000-0000-4000-8000-000000000009';
            const organizationId = '00000000-0000-4000-8000-666666666666';

            // Return data that doesn't match schema (invalid UUID)
            const invalidOrganizations = [
                {
                    id: 'invalid-uuid',
                    ownerUserId: organizationId,
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                    deletedAt: undefined
                }
            ];

            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok(invalidOrganizations));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-parse-error'
            });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid organizations data'
                }
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000010';
            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok([]));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: ''
            });

            expect(response.status).toBe(200);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle large number of organizations', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000011';

            // Create 100 organizations
            const mockOrganizations = Array.from({ length: 100 }, (_, i) => ({
                id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
                ownerUserId: principalExternalId,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                deletedAt: undefined
            }));

            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok(mockOrganizations));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-many-organizations'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toHaveLength(100);
        });

        it('should handle organizations with null deletedAt explicitly', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000012';
            const organizationId = '00000000-0000-4000-8000-777777777777';

            const mockOrganizations = [
                {
                    id: organizationId,
                    ownerUserId: principalExternalId,
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                    deletedAt: null
                }
            ];

            mockListUserOrganizationsExecute.mockResolvedValue(
                mockResult.ok(mockOrganizations as any)
            );

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {},
                principal,
                requestId: 'req-null-deleted'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data[0].deletedAt).toBe(undefined);
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000013';
            mockListUserOrganizationsExecute.mockResolvedValue(mockResult.ok([]));

            const handler = makeListUserOrganizationsHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            await handler({
                input: {},
                principal,
                requestId: 'req-audit'
            });

            // Verify operation context was built correctly
            expect(mockListUserOrganizationsExecute).toHaveBeenCalledWith(
                { principalExternalId },
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'LIST_USER_ORGANIZATIONS'
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = listUserOrganizationsHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(listUserOrganizationsRoute);
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

            const handlerPackage = listUserOrganizationsHandlerPackage(
                mockUseCases,
                frameworkConfig
            );

            expect(handlerPackage).toHaveProperty('handler');
            expect(handlerPackage).toHaveProperty('schema');
            expect(typeof handlerPackage.handler).toBe('function');

            // Should have schema
            expect(handlerPackage.schema).toBeDefined();
        });

        it('should use ListUserOrganizationsRequestSchema', () => {
            const handlerPackage = listUserOrganizationsHandlerPackage(mockUseCases);

            // ListUserOrganizationsRequestSchema is an empty object schema
            expect(handlerPackage.schema).toBeDefined();
        });
    });
});
