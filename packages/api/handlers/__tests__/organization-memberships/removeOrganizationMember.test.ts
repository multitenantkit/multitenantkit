import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    makeRemoveOrganizationMemberHandler,
    removeOrganizationMemberRoute,
    removeOrganizationMemberHandlerPackage
} from '../../src/organization-memberships/remove-organization-member/removeOrganizationMember';
import type { UseCases } from '@multitenantkit/domain-contracts';
import {
    ValidationError,
    UnauthorizedError,
    NotFoundError,
    BusinessRuleError
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

describe('RemoveOrganizationMember Handler', () => {
    let mockUseCases: UseCases;
    let mockRemoveOrganizationMemberExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockRemoveOrganizationMemberExecute = vi.fn();

        mockUseCases = {
            memberships: {
                removeOrganizationMember: {
                    execute: mockRemoveOrganizationMemberExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(removeOrganizationMemberRoute.method).toBe('DELETE');
            expect(removeOrganizationMemberRoute.path).toBe(
                '/organizations/:organizationId/members/:userId'
            );
            expect(removeOrganizationMemberRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 200 when use case succeeds', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000001';
            const organizationId = '00000000-0000-4000-8000-111111111111';
            const targetUserId = '00000000-0000-4000-8000-222222222222';

            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.ok(undefined));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(204);
            expect(response.body).toBeUndefined();
            expect(response.headers?.['X-Request-ID']).toBe('req-123');

            expect(mockRemoveOrganizationMemberExecute).toHaveBeenCalledWith(
                {
                    principalExternalId,
                    organizationId,
                    targetUser: targetUserId,
                    removeByUsername: false
                },
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'REMOVE_ORGANIZATION_MEMBER',
                    organizationId,
                    requestId: 'req-123',
                    metadata: expect.objectContaining({
                        source: 'api'
                    })
                })
            );
        });

        it('should include X-Request-ID in response headers', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-333333333333';
            const targetUserId = '00000000-0000-4000-8000-444444444444';

            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.ok(undefined));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: 'req-header-test'
            });

            expect(response.headers?.['X-Request-ID']).toBe('req-header-test');
        });

        it('should handle owner removing admin', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000003';
            const organizationId = '00000000-0000-4000-8000-555555555555';
            const targetUserId = '00000000-0000-4000-8000-666666666666';

            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.ok(undefined));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: 'req-remove-admin'
            });

            expect(response.status).toBe(204);
        });

        it('should handle admin removing member', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000004';
            const organizationId = '00000000-0000-4000-8000-777777777777';
            const targetUserId = '00000000-0000-4000-8000-888888888888';

            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.ok(undefined));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: 'req-remove-member'
            });

            expect(response.status).toBe(204);
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const organizationId = '00000000-0000-4000-8000-999999999999';
            const targetUserId = '00000000-0000-4000-8000-101010101010';
            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
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

            expect(mockRemoveOrganizationMemberExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Authorization', () => {
        it('should return 401 when user is not authorized to remove members', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000005';
            const organizationId = '00000000-0000-4000-8000-111111111110';
            const targetUserId = '00000000-0000-4000-8000-121212121212';
            const unauthorizedError = new UnauthorizedError(
                'Only organization owners and admins can remove members'
            );
            mockRemoveOrganizationMemberExecute.mockResolvedValue(
                mockResult.fail(unauthorizedError)
            );

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
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
                        'Only organization owners and admins can remove members'
                    )
                }
            });
        });
    });

    describe('Error Cases - Validation', () => {
        it('should return 404 when organization not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000006';
            const organizationId = '00000000-0000-4000-8000-131313131313';
            const targetUserId = '00000000-0000-4000-8000-141414141414';
            const notFoundError = new NotFoundError('Organization', organizationId);
            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
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

        it('should return 404 when target membership not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000007';
            const organizationId = '00000000-0000-4000-8000-151515151515';
            const targetUserId = '00000000-0000-4000-8000-161616161616';
            const notFoundError = new NotFoundError(
                'OrganizationMembership',
                `${targetUserId}-${organizationId}`
            );
            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: 'req-target-not-found'
            });

            expect(response.status).toBe(404);
            expect(response.body).toMatchObject({
                error: {
                    code: 'NOT_FOUND',
                    message: expect.stringContaining('not found')
                }
            });
        });

        it('should return 400 for validation errors', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000008';
            const organizationId = '00000000-0000-4000-8000-171717171717';
            const targetUserId = '00000000-0000-4000-8000-181818181818';
            const validationError = new ValidationError('Invalid user ID', 'targetUserId');
            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
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
                    message: 'Invalid user ID',
                    details: {
                        field: 'targetUserId'
                    },
                    requestId: 'req-validation'
                }
            });
        });
    });

    describe('Error Cases - Business Rules', () => {
        it('should return 422 when trying to remove organization owner', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000009';
            const organizationId = '00000000-0000-4000-8000-191919191919';
            const targetUserId = '00000000-0000-4000-8000-202020202020';
            const businessError = new BusinessRuleError('Cannot remove organization owner');
            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.fail(businessError));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: 'req-remove-owner'
            });

            expect(response.status).toBe(422);
            expect(response.body).toMatchObject({
                error: {
                    code: 'BUSINESS_RULE_VIOLATION',
                    message: 'Cannot remove organization owner'
                }
            });
        });

        it('should return 422 when member has already left', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000010';
            const organizationId = '00000000-0000-4000-8000-212121212121';
            const targetUserId = '00000000-0000-4000-8000-222222222221';
            const businessError = new BusinessRuleError('Member has already left the organization');
            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.fail(businessError));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: 'req-already-left'
            });

            expect(response.status).toBe(422);
            expect(response.body).toMatchObject({
                error: {
                    code: 'BUSINESS_RULE_VIOLATION',
                    message: expect.stringContaining('already left')
                }
            });
        });
    });

    describe('Error Cases - Unexpected Errors', () => {
        it('should return 500 for unexpected errors in use case', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000011';
            const organizationId = '00000000-0000-4000-8000-232323232323';
            const targetUserId = '00000000-0000-4000-8000-242424242424';
            mockRemoveOrganizationMemberExecute.mockRejectedValue(
                new Error('Database connection lost')
            );

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
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
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000013';
            const organizationId = '00000000-0000-4000-8000-272727272727';
            const targetUserId = '00000000-0000-4000-8000-282828282828';

            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.ok(undefined));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: ''
            });

            expect(response.status).toBe(204);
            expect(response.headers?.['X-Request-ID']).toBe('');
            expect(response.body).toBeUndefined();
        });

        it('should handle removing self (different from leaving)', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000014';
            const organizationId = '00000000-0000-4000-8000-292929292929';

            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.ok(undefined));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: {
                        organizationId,
                        userId // Same as principal userId
                    }
                },
                principal,
                requestId: 'req-remove-self'
            });

            expect(response.status).toBe(204);
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000001';
            const userId = '00000000-0000-4000-8000-000000000015';
            const organizationId = '00000000-0000-4000-8000-303030303030';
            const targetUserId = '00000000-0000-4000-8000-313131313131';

            mockRemoveOrganizationMemberExecute.mockResolvedValue(mockResult.ok(undefined));

            const handler = makeRemoveOrganizationMemberHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            await handler({
                input: {
                    params: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                principal,
                requestId: 'req-audit'
            });

            expect(mockRemoveOrganizationMemberExecute).toHaveBeenCalledWith(
                {
                    principalExternalId,
                    organizationId,
                    targetUser: targetUserId,
                    removeByUsername: false
                },
                expect.objectContaining({
                    actorUserId: principalExternalId,
                    auditAction: 'REMOVE_ORGANIZATION_MEMBER',
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
            const handlerPackage = removeOrganizationMemberHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(removeOrganizationMemberRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should use RemoveOrganizationMemberRequestSchema', () => {
            const handlerPackage = removeOrganizationMemberHandlerPackage(mockUseCases);

            expect(handlerPackage.schema).toHaveProperty('shape');
            expect(handlerPackage.schema.shape).toHaveProperty('params');
        });
    });
});
