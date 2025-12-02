import type { UseCases } from '@multitenantkit/domain-contracts';
import { createPrincipal } from '@multitenantkit/domain-contracts/shared/auth/Principal';
import {
    BusinessRuleError,
    NotFoundError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    leaveOrganizationHandlerPackage,
    leaveOrganizationRoute,
    makeLeaveOrganizationHandler
} from '../../src/organization-memberships/leave-organization/leaveOrganization';

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

describe('LeaveOrganization Handler', () => {
    let mockUseCases: UseCases;
    let mockLeaveOrganizationExecute: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockLeaveOrganizationExecute = vi.fn();

        mockUseCases = {
            memberships: {
                leaveOrganization: {
                    execute: mockLeaveOrganizationExecute
                }
            }
        } as any;
    });

    describe('Route Configuration', () => {
        it('should have correct route definition', () => {
            expect(leaveOrganizationRoute.method).toBe('DELETE');
            expect(leaveOrganizationRoute.path).toBe('/organizations/:organizationId/members/me');
            expect(leaveOrganizationRoute.auth).toBe('required');
        });
    });

    describe('Happy Path', () => {
        it('should return 200 with updated membership when user leaves organization', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000001';
            const organizationId = '00000000-0000-4000-8000-111111111111';
            const membershipId = '00000000-0000-4000-8000-222222222222';

            const mockMembership = {
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z')
            };

            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-123'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toEqual({
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z')
            });
            expect(response.headers?.['X-Request-ID']).toBe('req-123');

            expect(mockLeaveOrganizationExecute).toHaveBeenCalledWith(
                {
                    organizationId,
                    principalExternalId
                },
                expect.objectContaining({
                    externalId: principalExternalId,
                    auditAction: 'LEAVE_ORGANIZATION',
                    organizationId
                })
            );
        });

        it('should include X-Request-ID in response headers', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000002';
            const organizationId = '00000000-0000-4000-8000-333333333333';
            const membershipId = '00000000-0000-4000-8000-444444444444';

            const mockMembership = {
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z')
            };

            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-header-test'
            });

            expect(response.headers?.['X-Request-ID']).toBe('req-header-test');
        });

        it('should handle admin leaving organization', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000003';
            const organizationId = '00000000-0000-4000-8000-555555555555';
            const membershipId = '00000000-0000-4000-8000-666666666666';

            const mockMembership = {
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'admin',
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z')
            };

            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-admin-leave'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.roleCode).toBe('admin');
            expect((response.body as any).data.leftAt).toEqual(
                new Date('2025-01-15T00:00:00.000Z')
            );
        });
    });

    describe('Error Cases - Authentication', () => {
        it('should return 400 when principal is missing', async () => {
            const organizationId = '00000000-0000-4000-8000-777777777777';
            const handler = makeLeaveOrganizationHandler(mockUseCases);

            const response = await handler({
                input: {
                    params: { organizationId }
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

            expect(mockLeaveOrganizationExecute).not.toHaveBeenCalled();
        });
    });

    describe('Error Cases - Validation', () => {
        it('should return 404 when organization not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-888888888888';
            const notFoundError = new NotFoundError('Organization', organizationId);
            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
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

        it('should return 404 when membership not found', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000005';
            const organizationId = '00000000-0000-4000-8000-999999999999';
            const notFoundError = new NotFoundError(
                'OrganizationMembership',
                `${userId}-${organizationId}`
            );
            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.fail(notFoundError));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-membership-not-found'
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
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-101010101010';
            const validationError = new ValidationError(
                'Invalid organization ID',
                'organizationId'
            );
            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.fail(validationError));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
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

    describe('Error Cases - Business Rules', () => {
        it('should return 422 when owner tries to leave organization', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-111111111110';
            const businessError = new BusinessRuleError(
                'Organization owner cannot leave the organization'
            );
            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.fail(businessError));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-owner-leave'
            });

            expect(response.status).toBe(422);
            expect(response.body).toMatchObject({
                error: {
                    code: 'BUSINESS_RULE_VIOLATION',
                    message: 'Organization owner cannot leave the organization'
                }
            });
        });

        it('should return 422 when member has already left', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-121212121212';
            const businessError = new BusinessRuleError('Member has already left the organization');
            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.fail(businessError));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
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
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const organizationId = '00000000-0000-4000-8000-131313131313';
            mockLeaveOrganizationExecute.mockRejectedValue(new Error('Database connection lost'));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
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
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000010';
            const organizationId = '00000000-0000-4000-8000-141414141414';
            const membershipId = '00000000-0000-4000-8000-333333333335';

            const validMembership = {
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z'),
                invitedAt: undefined,
                deletedAt: undefined
            };

            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.ok(validMembership));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-parse-error'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data).toMatchObject({
                id: membershipId,
                userId,
                organizationId
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string request ID', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000011';
            const organizationId = '00000000-0000-4000-8000-151515151515';
            const membershipId = '00000000-0000-4000-8000-161616161616';

            const mockMembership = {
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z')
            };

            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: ''
            });

            expect(response.status).toBe(200);
            expect(response.headers?.['X-Request-ID']).toBe('');
        });

        it('should handle membership with null joinedAt', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000012';
            const organizationId = '00000000-0000-4000-8000-171717171717';
            const membershipId = '00000000-0000-4000-8000-181818181818';

            const mockMembership = {
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'member',
                joinedAt: undefined,
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z')
            };

            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.ok(mockMembership as any));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-null-joined'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.joinedAt).toBe(undefined);
        });

        it('should handle membership with joinedAt date (coverage for ?? branch)', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000016';
            const organizationId = '00000000-0000-4000-8000-222222222221';
            const membershipId = '00000000-0000-4000-8000-232323232323';

            const mockMembership = {
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-10T00:00:00.000Z'),
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z')
            };

            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            const response = await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-joined-date'
            });

            expect(response.status).toBe(200);
            expect((response.body as any).data.joinedAt).toEqual(
                new Date('2025-01-10T00:00:00.000Z')
            );
        });
    });

    describe('Integration - Operation Context', () => {
        it('should build correct operation context for audit', async () => {
            const principalExternalId = '00000000-0000-4000-8000-000000000000';
            const userId = '00000000-0000-4000-8000-000000000013';
            const organizationId = '00000000-0000-4000-8000-191919191919';
            const membershipId = '00000000-0000-4000-8000-202020202020';

            const mockMembership = {
                id: membershipId,
                userId,
                organizationId,
                roleCode: 'member',
                joinedAt: new Date('2025-01-01T00:00:00.000Z'),
                leftAt: new Date('2025-01-15T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-15T00:00:00.000Z')
            };

            mockLeaveOrganizationExecute.mockResolvedValue(mockResult.ok(mockMembership));

            const handler = makeLeaveOrganizationHandler(mockUseCases);
            const principal = createPrincipal(principalExternalId);

            await handler({
                input: {
                    params: { organizationId }
                },
                principal,
                requestId: 'req-audit'
            });

            expect(mockLeaveOrganizationExecute).toHaveBeenCalledWith(
                {
                    organizationId,
                    principalExternalId
                },
                expect.objectContaining({
                    externalId: principalExternalId,
                    auditAction: 'LEAVE_ORGANIZATION',
                    organizationId
                })
            );
        });
    });

    describe('Handler Package', () => {
        it('should create complete handler package with correct structure', () => {
            const handlerPackage = leaveOrganizationHandlerPackage(mockUseCases);

            expect(handlerPackage).toHaveProperty('route');
            expect(handlerPackage).toHaveProperty('schema');
            expect(handlerPackage).toHaveProperty('handler');

            expect(handlerPackage.route).toEqual(leaveOrganizationRoute);
            expect(typeof handlerPackage.handler).toBe('function');
        });

        it('should use LeaveOrganizationRequestSchema', () => {
            const handlerPackage = leaveOrganizationHandlerPackage(mockUseCases);

            expect(handlerPackage.schema).toHaveProperty('shape');
            expect(handlerPackage.schema.shape).toHaveProperty('params');
        });
    });
});
