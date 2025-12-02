import type { UseCases } from '@multitenantkit/domain-contracts';
import { createPrincipal } from '@multitenantkit/domain-contracts/shared/auth/Principal';
import {
    BusinessRuleError,
    ConflictError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    addOrganizationMemberHandlerPackage,
    addOrganizationMemberRoute,
    makeAddOrganizationMemberHandler
} from '../../src/organization-memberships/add-organization-member/addOrganizationMember';

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

describe('AddOrganizationMember Handler', () => {
    let mockUseCases: UseCases;
    let mockAddOrganizationMemberExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockAddOrganizationMemberExecute = vi.fn();

        mockUseCases = {
            memberships: {
                addOrganizationMember: {
                    execute: mockAddOrganizationMemberExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(addOrganizationMemberRoute.method).toBe('POST');
            expect(addOrganizationMemberRoute.path).toBe('/organizations/:organizationId/members');
            expect(addOrganizationMemberRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 201 with membership data when use case succeeds', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-111111111111';
            const targetUserId = '00000000-0000-4000-8000-222222222222';
            const username = 'testuser';
            const membershipId = '00000000-0000-4000-8000-333333333333';

            const mockMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: undefined
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username,
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data).toEqual({
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: undefined
            });
            expect(response.headers?.Location).toBe(
                `/organizations/${organizationId}/members/${targetUserId}`
            );
            expect(response.headers?.['X-Request-ID']).toBe('req-123');

            expect(mockAddOrganizationMemberExecute).toHaveBeenCalledWith(
                {
                    principalExternalId,
                    organizationId,
                    username,
                    roleCode: 'member'
                },
                expect.objectContaining({
                    externalId: principalExternalId,
                    auditAction: 'ADD_ORGANIZATION_MEMBER',
                    organizationId,
                    requestId: 'req-123',
                    metadata: expect.objectContaining({
                        source: 'api'
                    })
                })
            );
        });

        it('should include Location header with membership URL', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-444444444444';
            const targetUserId = '00000000-0000-4000-8000-555555555555';
            const username = 'adminuser';
            const membershipId = '00000000-0000-4000-8000-666666666666';

            const mockMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'admin',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: undefined
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username,
                        roleCode: 'admin'
                    }
                },
                principal,
                requestId: 'req-location'
            });

            expect(response.headers?.Location).toBe(
                `/organizations/${organizationId}/members/${targetUserId}`
            );
        });

        it('should handle adding member with admin role', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-777777777777';
            const targetUserId = '00000000-0000-4000-8000-888888888888';
            const username = 'newadmin';
            const membershipId = '00000000-0000-4000-8000-999999999999';

            const mockMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'admin',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: undefined
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username,
                        roleCode: 'admin'
                    }
                },
                principal,
                requestId: 'req-admin-role'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data.roleCode).toBe('admin');
        });

        it('should handle reactivating a member who previously left', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-101010101010';
            const targetUserId = '00000000-0000-4000-8000-111111111111';
            const username = 'reactivateduser';
            const membershipId = '00000000-0000-4000-8000-121212121212';

            const mockMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-20T00:00:00.000Z'), // New join date
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-20T00:00:00.000Z'),
                leftAt: undefined // Cleared on reactivation
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username,
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-reactivate'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data.leftAt).toBe(undefined);
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const organizationId = '00000000-0000-4000-8000-131313131313';
            const handler = makeAddOrganizationMemberHandler(mockUseCases);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: '00000000-0000-4000-8000-141414141414',
                        roleCode: 'member'
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

            expect(mockAddOrganizationMemberExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Authorization', () => {
        it('should return 401 when user is not authorized to add members', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-151515151515';
            const unauthorizedError = new UnauthorizedError(
                'Only organization owners and admins can add members'
            );
            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.fail(unauthorizedError));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: '00000000-0000-4000-8000-161616161616',
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-unauthorized'
            });

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({
                error: {
                    code: 'UNAUTHORIZED',
                    message: expect.stringContaining(
                        'Only organization owners and admins can add members'
                    )
                }
            });
        });
    });

    describe('Error Cases - Validation', () => {
        it('should return 404 when organization not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-171717171717';
            const notFoundError = new NotFoundError('Organization', organizationId);
            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: '00000000-0000-4000-8000-181818181818',
                        roleCode: 'member'
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
        });

        it('should return 409 when member already exists', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-191919191919';
            const targetUserId = '00000000-0000-4000-8000-202020202020';
            const targetUsername = 'conflictuser';
            const conflictError = new ConflictError('OrganizationMembership', targetUserId);
            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.fail(conflictError));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: targetUsername,
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-conflict'
            });

            expect(response.status).toBe(409);
            // Remove timestamp for comparison
            delete (response.body as any).error.timestamp;
            expect(response.body).toEqual({
                error: {
                    code: 'CONFLICT',
                    message: `OrganizationMembership with identifier '${targetUserId}' already exists`,
                    details: {
                        resource: 'OrganizationMembership',
                        identifier: targetUserId
                    },
                    requestId: 'req-conflict'
                }
            });
        });

        it('should return 400 for validation errors', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-212121212121';
            const validationError = new ValidationError('Invalid role code', 'roleCode');
            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: '00000000-0000-4000-8000-222222222221',
                        roleCode: 'invalid' as any
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
                    message: 'Invalid role code',
                    details: {
                        field: 'roleCode'
                    },
                    requestId: 'req-validation'
                }
            });
        });

        it('should return 422 for business rule violations', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-232323232323';
            const businessError = new BusinessRuleError(
                'Cannot add more than 10 members to a organization'
            );
            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.fail(businessError));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: '00000000-0000-4000-8000-242424242424',
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-business-rule'
            });

            expect(response.status).toBe(422);
            expect(response.body).toMatchObject({
                error: {
                    code: 'BUSINESS_RULE_VIOLATION',
                    message: 'Cannot add more than 10 members to a organization'
                }
            });
        });
    });

    describe('Error Cases - Unexpected Errors', () => {
        it('should return 500 for unexpected errors in use case', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-252525252525';
            mockAddOrganizationMemberExecute.mockRejectedValue(
                new Error('Database connection lost')
            );

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: '00000000-0000-4000-8000-262626262626',
                        roleCode: 'member'
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

        it('should pass through data from domain without re-validation', async () => {
            // Note: We trust the domain layer to return valid data
            // Response validation was removed to avoid type conflicts with nullish transform
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-272727272727';
            const targetUserId = '00000000-0000-4000-8000-282828282828';
            const targetUsername = 'passthroughuser';
            const membershipId = '00000000-0000-4000-8000-333333333334';

            const validMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: undefined,
                invitedAt: undefined,
                deletedAt: undefined
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.ok(validMembership));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: targetUsername,
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-parse-error'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data).toMatchObject({
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member'
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-292929292929';
            const targetUserId = '00000000-0000-4000-8000-303030303030';
            const targetUsername = 'emptyreqid';
            const membershipId = '00000000-0000-4000-8000-313131313131';

            const mockMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: undefined
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: targetUsername,
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: ''
            });

            expect(response.status).toBe(201);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle membership with null leftAt', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-323232323232';
            const targetUserId = '00000000-0000-4000-8000-333333333331';
            const targetUsername = 'nullleftuser';
            const membershipId = '00000000-0000-4000-8000-343434343434';

            const mockMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: undefined
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(
                mockResult.ok(mockMembership as any)
            );

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: targetUsername,
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-null-left'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data.leftAt).toBe(undefined);
        });

        it('should handle membership with leftAt date (coverage for ?? branch)', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-424242424242';
            const targetUserId = '00000000-0000-4000-8000-434343434343';
            const targetUsername = 'leftatuser';
            const membershipId = '00000000-0000-4000-8000-444444444445';

            const mockMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: new Date('2025-01-20T00:00:00.000Z')
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username: targetUsername,
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-left-date'
            });

            expect(response.status).toBe(201);
            expect((response.body as any).data.leftAt).toEqual(
                new Date('2025-01-20T00:00:00.000Z')
            );
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-353535353535';
            const targetUserId = '00000000-0000-4000-8000-363636363636';
            const username = 'audituser';
            const membershipId = '00000000-0000-4000-8000-373737373737';

            const mockMembership = {
                id: membershipId,
                userId: targetUserId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                leftAt: undefined
            };

            mockAddOrganizationMemberExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeAddOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            await handler({
                input: {
                    params: { organizationId },
                    body: {
                        username,
                        roleCode: 'member'
                    }
                },
                principal,
                requestId: 'req-audit'
            });

            expect(mockAddOrganizationMemberExecute).toHaveBeenCalledWith(
                {
                    principalExternalId,
                    organizationId,
                    username,
                    roleCode: 'member'
                },
                expect.objectContaining({
                    externalId: principalExternalId,
                    auditAction: 'ADD_ORGANIZATION_MEMBER',
                    organizationId,
                    requestId: 'req-audit',
                    metadata: expect.objectContaining({
                        source: 'api'
                    })
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = addOrganizationMemberHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(addOrganizationMemberRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should use AddOrganizationMemberRequestSchema', () => {
            const handlerPackage = addOrganizationMemberHandlerPackage(mockUseCases);

            expect(handlerPackage.schema).toHaveProperty('shape');
            expect(handlerPackage.schema.shape).toHaveProperty('params');
            expect(handlerPackage.schema.shape).toHaveProperty('body');
        });
    });
});
