import {
    BusinessRuleError,
    ConflictError,
    InfrastructureError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors';
import { describe, expect, it } from 'vitest';
import { ErrorMapper } from '../../src/errors/ErrorMapper';

describe('ErrorMapper', () => {
    describe('getHttpStatus', () => {
        describe('Happy Path - Known Domain Errors', () => {
            it('should map ValidationError to 400 (Bad Request)', () => {
                const error = new ValidationError('Invalid email format', 'email');
                const status = ErrorMapper.getHttpStatus(error);

                expect(status).toBe(400);
            });

            it('should map UnauthorizedError to 401 (Unauthorized)', () => {
                const error = new UnauthorizedError('access organization', 'organization-123');
                const status = ErrorMapper.getHttpStatus(error);

                expect(status).toBe(401);
            });

            it('should map NotFoundError to 404 (Not Found)', () => {
                const error = new NotFoundError('User', 'user-123');
                const status = ErrorMapper.getHttpStatus(error);

                expect(status).toBe(404);
            });

            it('should map ConflictError to 409 (Conflict)', () => {
                const error = new ConflictError('User', 'email@example.com');
                const status = ErrorMapper.getHttpStatus(error);

                expect(status).toBe(409);
            });

            it('should map BusinessRuleError to 422 (Unprocessable Entity)', () => {
                const error = new BusinessRuleError(
                    'Cannot delete organization with active members'
                );
                const status = ErrorMapper.getHttpStatus(error);

                expect(status).toBe(422);
            });
        });

        describe('Edge Cases - Unknown Errors', () => {
            it('should map unknown DomainError to 500 (Internal Server Error)', () => {
                // Using InfrastructureError as a concrete DomainError that maps to 500
                const error = new InfrastructureError('Something went wrong');
                const status = ErrorMapper.getHttpStatus(error);

                expect(status).toBe(500);
            });

            it('should map InfrastructureError to 500 (Internal Server Error)', () => {
                const error = new InfrastructureError('Database connection failed');
                const status = ErrorMapper.getHttpStatus(error);

                expect(status).toBe(500);
            });
        });
    });

    describe('toHttpError', () => {
        describe('Happy Path - Complete Error Response', () => {
            it('should create complete HTTP error response for ValidationError', () => {
                const error = new ValidationError('Invalid email format', 'email', {
                    pattern: '^[a-z]+@[a-z]+\\.[a-z]+$'
                });

                const response = ErrorMapper.toHttpError(error, 'request-123');

                expect(response.status).toBe(400);
                // Remove timestamp for comparison
                delete (response.body as any).error.timestamp;
                expect(response.body).toEqual({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid email format',
                        details: {
                            field: 'email',
                            pattern: '^[a-z]+@[a-z]+\\.[a-z]+$'
                        },
                        requestId: 'request-123'
                    }
                });
            });

            it('should create complete HTTP error response for UnauthorizedError', () => {
                const error = new UnauthorizedError('update organization', 'organization-123');

                const response = ErrorMapper.toHttpError(error, 'request-123');

                expect(response.status).toBe(401);
                // Remove timestamp for comparison
                delete (response.body as any).error.timestamp;
                expect(response.body).toEqual({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Not authorized to update organization on organization-123',
                        details: {
                            action: 'update organization',
                            resource: 'organization-123'
                        },
                        requestId: 'request-123'
                    }
                });
            });

            it('should create complete HTTP error response for NotFoundError', () => {
                const error = new NotFoundError('User', 'user-123');

                const response = ErrorMapper.toHttpError(error, 'request-123');

                expect(response.status).toBe(404);
                // Remove timestamp for comparison
                delete (response.body as any).error.timestamp;
                expect(response.body).toEqual({
                    error: {
                        code: 'NOT_FOUND',
                        message: "User with identifier 'user-123' not found",
                        details: {
                            resource: 'User',
                            identifier: 'user-123'
                        },
                        requestId: 'request-123'
                    }
                });
            });

            it('should create complete HTTP error response for ConflictError', () => {
                const error = new ConflictError('User', 'email@example.com');

                const response = ErrorMapper.toHttpError(error, 'request-123');

                expect(response.status).toBe(409);
                // Remove timestamp for comparison
                delete (response.body as any).error.timestamp;
                expect(response.body).toEqual({
                    error: {
                        code: 'CONFLICT',
                        message: "User with identifier 'email@example.com' already exists",
                        details: {
                            resource: 'User',
                            identifier: 'email@example.com'
                        },
                        requestId: 'request-123'
                    }
                });
            });

            it('should create complete HTTP error response for BusinessRuleError', () => {
                const error = new BusinessRuleError(
                    'Cannot delete organization with active members',
                    {
                        organizationId: 'organization-123',
                        activeMemberCount: 5
                    }
                );

                const response = ErrorMapper.toHttpError(error, 'request-123');

                expect(response.status).toBe(422);
                // Remove timestamp for comparison
                delete (response.body as any).error.timestamp;
                expect(response.body).toEqual({
                    error: {
                        code: 'BUSINESS_RULE_VIOLATION',
                        message: 'Cannot delete organization with active members',
                        details: {
                            organizationId: 'organization-123',
                            activeMemberCount: 5
                        },
                        requestId: 'request-123'
                    }
                });
            });
        });

        describe('Edge Cases - Errors Without Details', () => {
            it('should handle error without details', () => {
                const error = new ValidationError('Invalid input');

                const response = ErrorMapper.toHttpError(error, 'request-123');

                expect(response.status).toBe(400);
                // Remove timestamp for comparison
                delete (response.body as any).error.timestamp;
                expect(response.body).toEqual({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input',
                        details: {
                            field: undefined
                        },
                        requestId: 'request-123'
                    }
                });
            });

            it('should handle error with infrastructure error', () => {
                // InfrastructureError has a code, so testing with custom error details
                const error = new InfrastructureError('Generic infrastructure error', {
                    component: 'database'
                });

                const response = ErrorMapper.toHttpError(error, 'request-123');

                expect(response.status).toBe(500);
                expect(response.body.error.code).toBe('INFRASTRUCTURE_ERROR');
                expect(response.body.error.message).toBe('Generic infrastructure error');
                expect(response.body.error.details).toEqual({
                    component: 'database'
                });
            });
        });

        describe('Edge Cases - Complex Details', () => {
            it('should preserve complex details object', () => {
                const error = new BusinessRuleError('Complex validation failed', {
                    reasons: ['reason1', 'reason2'],
                    metadata: {
                        timestamp: '2025-01-01T00:00:00.000Z',
                        userId: 'user-123'
                    },
                    nested: {
                        deep: {
                            value: 42
                        }
                    }
                });

                const response = ErrorMapper.toHttpError(error, 'request-123');

                expect(response.body.error.details).toEqual({
                    reasons: ['reason1', 'reason2'],
                    metadata: {
                        timestamp: '2025-01-01T00:00:00.000Z',
                        userId: 'user-123'
                    },
                    nested: {
                        deep: {
                            value: 42
                        }
                    }
                });
            });
        });
    });

    describe('fromGenericError', () => {
        describe('Happy Path - Standard Error', () => {
            it('should map generic Error to 500 with standard format', () => {
                const error = new Error('Unexpected database error');

                const response = ErrorMapper.fromGenericError(error, 'request-123');

                expect(response.status).toBe(500);
                // Remove timestamp for comparison
                delete (response.body as any).error.timestamp;
                expect(response.body).toEqual({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An unexpected error occurred',
                        details: {
                            originalMessage: 'Unexpected database error'
                        },
                        requestId: 'request-123'
                    }
                });
            });

            it('should preserve original error message in details', () => {
                const error = new Error('Connection timeout');

                const response = ErrorMapper.fromGenericError(error, 'request-123');

                expect(response.body.error.details?.originalMessage).toBe('Connection timeout');
            });
        });

        describe('Edge Cases - Special Error Types', () => {
            it('should handle TypeError', () => {
                const error = new TypeError('Cannot read property of undefined');

                const response = ErrorMapper.fromGenericError(error, 'request-123');

                expect(response.status).toBe(500);
                expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
                expect(response.body.error.details?.originalMessage).toBe(
                    'Cannot read property of undefined'
                );
            });

            it('should handle RangeError', () => {
                const error = new RangeError('Array length must be positive');

                const response = ErrorMapper.fromGenericError(error, 'request-123');

                expect(response.status).toBe(500);
                expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
                expect(response.body.error.details?.originalMessage).toBe(
                    'Array length must be positive'
                );
            });

            it('should handle error with empty message', () => {
                const error = new Error('');

                const response = ErrorMapper.fromGenericError(error, 'request-123');

                expect(response.status).toBe(500);
                expect(response.body.error.message).toBe('An unexpected error occurred');
                expect(response.body.error.details?.originalMessage).toBe('');
            });
        });
    });

    describe('Integration - Complete Error Flow', () => {
        it('should correctly handle a typical validation flow', () => {
            // Simulate a validation error from a use case
            const validationError = new ValidationError('Email is required', 'email');

            // Map to HTTP response
            const httpResponse = ErrorMapper.toHttpError(validationError, 'request-123');

            // Verify complete flow
            expect(httpResponse.status).toBe(400);
            expect(httpResponse.body.error.code).toBe('VALIDATION_ERROR');
            expect(httpResponse.body.error.message).toBe('Email is required');
            expect(httpResponse.body.error.details?.field).toBe('email');
        });

        it('should correctly handle a typical authorization flow', () => {
            // Simulate an unauthorized error from a use case
            const authError = new UnauthorizedError(
                'delete organization member',
                'organization-123'
            );

            // Map to HTTP response
            const httpResponse = ErrorMapper.toHttpError(authError, 'request-123');

            // Verify complete flow
            expect(httpResponse.status).toBe(401);
            expect(httpResponse.body.error.code).toBe('UNAUTHORIZED');
            expect(httpResponse.body.error.message).toContain('Not authorized');
        });

        it('should correctly handle unexpected errors', () => {
            // Simulate an unexpected error
            const unexpectedError = new Error('Database connection lost');

            // Map to HTTP response
            const httpResponse = ErrorMapper.fromGenericError(unexpectedError, 'request-123');

            // Verify complete flow
            expect(httpResponse.status).toBe(500);
            expect(httpResponse.body.error.code).toBe('INTERNAL_SERVER_ERROR');
            expect(httpResponse.body.error.message).toBe('An unexpected error occurred');
            expect(httpResponse.body.error.details?.originalMessage).toBe(
                'Database connection lost'
            );
        });
    });
});
