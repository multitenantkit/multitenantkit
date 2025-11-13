import { z } from 'zod';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { ErrorMapper, HttpErrorResponse } from '../errors/ErrorMapper';

/**
 * Options for schema validation
 */
export interface SchemaValidationOptions {
    /**
     * Custom error message (default: "Validation failed")
     */
    message?: string;
    /**
     * Field identifier for error reporting (default: "payload")
     */
    field?: string;
    /**
     * Request ID for error tracing
     */
    requestId: string;
}

/**
 * Success result of schema validation
 */
export interface ValidationSuccess<T> {
    success: true;
    data: T;
}

/**
 * Failure result of schema validation
 */
export interface ValidationFailure {
    success: false;
    httpErrorResponse: {
        status: number;
        body: HttpErrorResponse;
        headers: Record<string, string>;
    };
}

/**
 * Result of schema validation (union type)
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates a payload against a Zod schema and returns a structured result
 * with either parsed data or an HTTP error response.
 *
 * If schema is not provided (undefined/null), returns success with the payload as-is.
 *
 * @template T - The expected output type after successful validation
 * @param schema - Optional Zod schema to validate against. If not provided, returns payload as-is.
 * @param payload - Data to validate
 * @param options - Validation options (message, field, requestId)
 * @returns Promise with success flag and either data or httpErrorResponse
 *
 * @example
 * ```typescript
 * // With schema
 * const result = await validateWithSchema(
 *   updateUserSchema,
 *   input.body,
 *   { requestId: "req-123", field: "body", message: "Invalid request body" }
 * );
 *
 * // Without schema (returns payload as-is)
 * const result = await validateWithSchema(
 *   null,
 *   input.body,
 *   { requestId: "req-123" }
 * );
 *
 * if (!result.success) {
 *   return result.httpErrorResponse;
 * }
 *
 * const data = result.data;
 * ```
 */
export async function validateWithSchema<T>(
    schema: z.ZodSchema<T> | undefined | null,
    payload: unknown,
    options: SchemaValidationOptions
): Promise<ValidationResult<T>> {
    const { message = 'Validation failed', field = 'payload', requestId } = options;

    // If no schema provided, return payload as-is
    if (!schema) {
        return {
            success: true,
            data: payload as any
        };
    }

    const parseResult = await schema.safeParseAsync(payload);

    if (!parseResult.success) {
        const { status, body } = ErrorMapper.toHttpError(
            new ValidationError(message, field, parseResult.error.flatten()),
            requestId
        );

        return {
            success: false,
            httpErrorResponse: {
                status,
                body,
                headers: {
                    'X-Request-ID': requestId
                }
            }
        };
    }

    return {
        success: true,
        data: parseResult.data
    };
}

/**
 * Synchronous version of validateWithSchema for schemas that don't need async validation
 *
 * If schema is not provided (undefined/null), returns success with the payload as-is.
 *
 * @template T - The expected output type after successful validation
 * @param schema - Optional Zod schema to validate against. If not provided, returns payload as-is.
 * @param payload - Data to validate
 * @param options - Validation options (message, field, requestId)
 * @returns Result with success flag and either data or httpErrorResponse
 *
 * @example
 * ```typescript
 * // With schema
 * const result = validateWithSchemaSync(
 *   simpleSchema,
 *   input.params,
 *   { requestId: "req-123", field: "params" }
 * );
 *
 * // Without schema (returns payload as-is)
 * const result = validateWithSchemaSync(
 *   null,
 *   input.body,
 *   { requestId: "req-123" }
 * );
 *
 * if (!result.success) {
 *   return result.httpErrorResponse;
 * }
 *
 * const params = result.data;
 * ```
 */
export function validateWithSchemaSync<T>(
    schema: z.ZodSchema<T> | undefined | null,
    payload: unknown,
    options: SchemaValidationOptions
): ValidationResult<T> {
    const { message = 'Validation failed', field = 'payload', requestId } = options;

    // If no schema provided, return payload as-is
    if (!schema) {
        return {
            success: true,
            data: payload as any
        };
    }

    const parseResult = schema.safeParse(payload);

    if (!parseResult.success) {
        const { status, body } = ErrorMapper.toHttpError(
            new ValidationError(message, field, parseResult.error.flatten()),
            requestId
        );

        return {
            success: false,
            httpErrorResponse: {
                status,
                body,
                headers: {
                    'X-Request-ID': requestId
                }
            }
        };
    }

    return {
        success: true,
        data: parseResult.data
    };
}
