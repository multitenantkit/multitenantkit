import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import { createPrincipal } from '@multitenantkit/domain-contracts/shared/auth/Principal';
import {
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    listOrganizationMembersHandlerPackage,
    listOrganizationMembersRoute,
    makeListOrganizationMembersHandler
} from '../../src/organizations/list-organization-members/listOrganizationMembers';

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

describe('ListOrganizationMembers Handler', () => {
    let mockUseCases: UseCases;
    let mockListOrganizationMembersExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create mock for listOrganizationMembers use case
        mockListOrganizationMembersExecute = vi.fn();

        mockUseCases = {
            organizations: {
                listOrganizationMembers: {
                    execute: mockListOrganizationMembersExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(listOrganizationMembersRoute.method).toBe('GET');
            expect(listOrganizationMembersRoute.path).toBe(
                '/organizations/:organizationId/members'
            );
            expect(listOrganizationMembersRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 200 with organization members when use case succeeds', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const userId = '00000000-0000-4000-8000-000000000001';
            const organizationId = '00000000-0000-4000-8000-111111111111';
            const memberId1 = '00000000-0000-4000-8000-111111111110';
            const memberId2 = '00000000-0000-4000-8000-111111111112';

            const mockMembers = [
                {
                    id: memberId1,
                    userId,
                    username: 'owner',
                    organizationId,
                    roleCode: 'owner',
                    joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        id: userId,
                        externalId: userId,
                        username: 'owner',
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        deletedAt: undefined
                    },
                    organization: {
                        id: organizationId,
                        ownerUserId: userId,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        archivedAt: undefined,
                        deletedAt: undefined
                    }
                },
                {
                    id: memberId2,
                    userId: '00000000-0000-4000-8000-000000000002',
                    username: 'user2',
                    organizationId,
                    roleCode: 'member',
                    joinedAt: new Date('2025-01-02T00:00:00.000Z'),
                    createdAt: new Date('2025-01-02T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        id: '00000000-0000-4000-8000-000000000002',
                        externalId: '00000000-0000-4000-8000-000000000002',
                        username: 'user2',
                        createdAt: new Date('2025-01-02T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                        deletedAt: undefined
                    },
                    organization: {
                        id: organizationId,
                        ownerUserId: userId,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        archivedAt: undefined,
                        deletedAt: undefined
                    }
                }
            ];

            // Mock paginated result
            const mockPaginatedResult = {
                items: mockMembers,
                pagination: {
                    total: mockMembers.length,
                    page: 1,
                    pageSize: 20,
                    totalPages: 1
                }
            };

            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.ok(mockPaginatedResult)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual(mockMembers);
            expect(response.headers?.['X-Request-ID']).toBe('req-123');

            // Verify use case was called correctly
            expect(mockListOrganizationMembersExecute).toHaveBeenCalledWith(
                expect.objectContaining({
                    organizationId,
                    principalExternalId,
                    options: expect.objectContaining({ page: 1, pageSize: 20 })
                }),
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'LIST_ORGANIZATION_MEMBERS',
                    organizationId
                })
            );
        });

        it('should include X-Request-ID in response headers', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const userId = '00000000-0000-4000-8000-000000000003';
            const organizationId = '00000000-0000-4000-8000-333333333333';

            const mockMembers = [
                {
                    id: '00000000-0000-4000-8000-333333333330',
                    userId,
                    username: 'testowner',
                    organizationId,
                    roleCode: 'owner',
                    joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        id: userId,
                        externalId: userId,
                        username: 'testowner',
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        deletedAt: undefined
                    },
                    organization: {
                        id: organizationId,
                        ownerUserId: userId,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        archivedAt: undefined,
                        deletedAt: undefined
                    }
                }
            ];

            const mockPaginatedResult = {
                items: mockMembers,
                pagination: { total: mockMembers.length, page: 1, pageSize: 20, totalPages: 1 }
            };
            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.ok(mockPaginatedResult)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
                principal,
                requestId: 'req-header-test'
            });

            expect(response.headers?.['X-Request-ID']).toBe('req-header-test');
        });

        it('should return empty members array when organization has no members', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const organizationId = '00000000-0000-4000-8000-444444444444';

            const mockPaginatedResult = {
                items: [],
                pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 }
            };
            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.ok(mockPaginatedResult)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
                principal,
                requestId: 'req-empty'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual([]);
        });

        it('should handle members with different roles', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const userId = '00000000-0000-4000-8000-000000000005';
            const organizationId = '00000000-0000-4000-8000-555555555555';

            const mockMembers = [
                {
                    id: '00000000-0000-4000-8000-555555555550',
                    userId,
                    username: 'multiowner',
                    organizationId,
                    roleCode: 'owner',
                    joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        id: userId,
                        externalId: userId,
                        username: 'multiowner',
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        deletedAt: undefined
                    },
                    organization: {
                        id: organizationId,
                        ownerUserId: userId,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        archivedAt: undefined,
                        deletedAt: undefined
                    }
                },
                {
                    id: '00000000-0000-4000-8000-555555555551',
                    userId: '00000000-0000-4000-8000-000000000006',
                    username: 'adminuser',
                    organizationId,
                    roleCode: 'admin',
                    joinedAt: new Date('2025-01-02T00:00:00.000Z'),
                    createdAt: new Date('2025-01-02T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        id: '00000000-0000-4000-8000-000000000006',
                        externalId: '00000000-0000-4000-8000-000000000006',
                        username: 'adminuser',
                        createdAt: new Date('2025-01-02T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                        deletedAt: undefined
                    },
                    organization: {
                        id: organizationId,
                        ownerUserId: userId,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        archivedAt: undefined,
                        deletedAt: undefined
                    }
                },
                {
                    id: '00000000-0000-4000-8000-555555555552',
                    userId: '00000000-0000-4000-8000-000000000007',
                    username: 'memberuser',
                    organizationId,
                    roleCode: 'member',
                    joinedAt: new Date('2025-01-03T00:00:00.000Z'),
                    createdAt: new Date('2025-01-03T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-03T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        id: '00000000-0000-4000-8000-000000000007',
                        externalId: '00000000-0000-4000-8000-000000000007',
                        username: 'memberuser',
                        createdAt: new Date('2025-01-03T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-03T00:00:00.000Z'),
                        deletedAt: undefined
                    },
                    organization: {
                        id: organizationId,
                        ownerUserId: userId,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        archivedAt: undefined,
                        deletedAt: undefined
                    }
                }
            ];

            const mockPaginatedResult = {
                items: mockMembers,
                pagination: { total: mockMembers.length, page: 1, pageSize: 20, totalPages: 1 }
            };
            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.ok(mockPaginatedResult)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
                principal,
                requestId: 'req-roles'
            });

            expect(response.status).toBe(200);
            const body = (response.body as any).data;
            expect(body).toHaveLength(3);
            expect(body[0].roleCode).toBe('owner');
            expect(body[1].roleCode).toBe('admin');
            expect(body[2].roleCode).toBe('member');
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const organizationId = '00000000-0000-4000-8000-666666666666';
            const handler = makeListOrganizationMembersHandler(mockUseCases);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
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
            expect(mockListOrganizationMembersExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Authorization', () => {
        it('should return 401 when user is not a member of the organization', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const organizationId = '00000000-0000-4000-8000-888888888888';
            const unauthorizedError = new UnauthorizedError(
                'Not authorized to access this organization'
            );
            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.fail(unauthorizedError)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
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
    });

    describe('Error Cases - Validation', () => {
        it('should return 404 when organization not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const organizationId = '00000000-0000-4000-8000-999999999999';
            const notFoundError = new NotFoundError('Organization', organizationId);
            mockListOrganizationMembersExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
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
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const organizationId = '00000000-0000-4000-8000-101010101010';
            const validationError = new ValidationError(
                'Invalid organization ID',
                'organizationId'
            );
            mockListOrganizationMembersExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
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
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const organizationId = '00000000-0000-4000-8000-111111111110';
            mockListOrganizationMembersExecute.mockRejectedValue(
                new Error('Database connection lost')
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
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
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const userId = '00000000-0000-4000-8000-000000000012';
            const organizationId = '00000000-0000-4000-8000-121212121212';
            // Return data that doesn't match schema (missing required field)
            const invalidMembers = [
                {
                    id: 'invalid-uuid',
                    userId,
                    organizationId,
                    roleCode: 'owner'
                    // Missing required fields
                }
            ];

            const mockPaginatedResult = {
                items: invalidMembers,
                pagination: { total: invalidMembers.length, page: 1, pageSize: 20, totalPages: 1 }
            };
            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.ok(mockPaginatedResult as any)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
                principal,
                requestId: 'req-parse-error'
            });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid members data'
                }
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const userId = '00000000-0000-4000-8000-000000000013';
            const organizationId = '00000000-0000-4000-8000-131313131313';

            const mockMembers = [
                {
                    id: '00000000-0000-4000-8000-131313131310',
                    userId,
                    username: 'edgecaseowner',
                    organizationId,
                    roleCode: 'owner',
                    joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        id: userId,
                        externalId: userId,
                        username: 'edgecaseowner',
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        deletedAt: undefined
                    },
                    organization: {
                        id: organizationId,
                        ownerUserId: userId,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        archivedAt: undefined,
                        deletedAt: undefined
                    }
                }
            ];

            const mockPaginatedResult = {
                items: mockMembers,
                pagination: { total: mockMembers.length, page: 1, pageSize: 20, totalPages: 1 }
            };
            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.ok(mockPaginatedResult)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
                principal,
                requestId: ''
            });

            expect(response.status).toBe(200);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle members with undefined leftAt and deletedAt', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const userId = '00000000-0000-4000-8000-000000000014';
            const organizationId = '00000000-0000-4000-8000-141414141414';

            const mockMembers = [
                {
                    id: '00000000-0000-4000-8000-141414141410',
                    userId,
                    username: 'edgeowner',
                    organizationId,
                    roleCode: 'owner',
                    joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        id: userId,
                        externalId: userId,
                        username: 'edgeowner',
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        deletedAt: undefined
                    },
                    organization: {
                        id: organizationId,
                        ownerUserId: userId,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        archivedAt: undefined,
                        deletedAt: undefined
                    }
                }
            ];

            const mockPaginatedResult = {
                items: mockMembers,
                pagination: { total: mockMembers.length, page: 1, pageSize: 20, totalPages: 1 }
            };
            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.ok(mockPaginatedResult)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
                principal,
                requestId: 'req-undefined-fields'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data[0].leftAt).toBeUndefined();
            expect((response.body as any).data[0].deletedAt).toBeUndefined();
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit with organizationId', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000014';
            const userId = '00000000-0000-4000-8000-000000000015';
            const organizationId = '00000000-0000-4000-8000-151515151515';

            const mockMembers = [
                {
                    id: '00000000-0000-4000-8000-151515151510',
                    userId,
                    organizationId,
                    roleCode: 'owner',
                    joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    leftAt: undefined,
                    deletedAt: undefined,
                    user: {
                        email: 'user@example.com'
                    }
                }
            ];

            const mockPaginatedResult = {
                items: mockMembers,
                pagination: { total: mockMembers.length, page: 1, pageSize: 20, totalPages: 1 }
            };
            mockListOrganizationMembersExecute.mockResolvedValue(
                mockResult.ok(mockPaginatedResult)
            );

            const handler = makeListOrganizationMembersHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            await handler({
                input: {
                    params: { organizationId },
                    query: undefined
                } as any,
                principal,
                requestId: 'req-audit'
            });

            // Verify operation context was built correctly
            expect(mockListOrganizationMembersExecute).toHaveBeenCalledWith(
                expect.objectContaining({
                    organizationId,
                    principalExternalId,
                    options: expect.objectContaining({ page: 1, pageSize: 20 })
                }),
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'LIST_ORGANIZATION_MEMBERS',
                    organizationId
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = listOrganizationMembersHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(listOrganizationMembersRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should create handler package with toolkit options', () => {
            const toolkitOptions: ToolkitOptions = {} as any;

            const handlerPackage = listOrganizationMembersHandlerPackage(
                mockUseCases,
                toolkitOptions
            );

            expect(handlerPackage).toHaveProperty('handler');
            expect(handlerPackage).toHaveProperty('schema');
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should use ListOrganizationMembersRequestSchema', () => {
            const handlerPackage = listOrganizationMembersHandlerPackage(mockUseCases);

            // Verify schema structure
            expect(handlerPackage.schema).toHaveProperty('shape');
            expect(handlerPackage.schema.shape).toHaveProperty('params');
        });
    });
});
