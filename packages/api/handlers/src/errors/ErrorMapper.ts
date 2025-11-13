import {
    DomainError,
    ValidationError,
    NotFoundError,
    ConflictError,
    BusinessRuleError,
    UnauthorizedError
} from '@multitenantkit/domain-contracts/shared/errors';

/**
 * HTTP Error Response format
 * Consistent with ErrorResponseSchema from api-contracts
 */
export interface HttpErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        requestId: string;
        timestamp: string;
    };
}

/**
 * Maps domain errors to HTTP status codes and responses
 */
export class ErrorMapper {
    /**
     * Map domain error to HTTP status code
     */
    static getHttpStatus(error: DomainError): number {
        if (error instanceof ValidationError) {
            return 400; // Bad Request
        }

        if (error instanceof UnauthorizedError) {
            return 401; // Unauthorized
        }

        if (error instanceof NotFoundError) {
            return 404; // Not Found
        }

        if (error instanceof ConflictError) {
            return 409; // Conflict
        }

        if (error instanceof BusinessRuleError) {
            return 422; // Unprocessable Entity
        }

        // Default to 500 for unknown domain errors
        return 500;
    }

    /**
     * Map domain error to HTTP error response
     *
     * @param error - Domain error to map
     * @param requestId - Request ID for tracing
     * @returns HTTP status and error response body
     */
    static toHttpError(
        error: DomainError,
        requestId: string
    ): {
        status: number;
        body: HttpErrorResponse;
    } {
        const status = this.getHttpStatus(error);

        const body: HttpErrorResponse = {
            error: {
                code: error.code || 'UNKNOWN_ERROR',
                message: error.message,
                details: error.details,
                requestId,
                timestamp: new Date().toISOString()
            }
        };

        return { status, body };
    }

    /**
     * Map generic error to HTTP error response
     *
     * @param error - Generic error to map
     * @param requestId - Request ID for tracing
     * @returns HTTP status and error response body
     */
    static fromGenericError(
        error: Error,
        requestId: string
    ): {
        status: number;
        body: HttpErrorResponse;
    } {
        return {
            status: 500,
            body: {
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred',
                    details: {
                        originalMessage: error.message
                    },
                    requestId,
                    timestamp: new Date().toISOString()
                }
            }
        };
    }
}
