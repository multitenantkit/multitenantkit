// Request validation middleware for Supabase Edge Functions

import type { ZodSchema } from 'zod';

/**
 * Validation schema configuration
 */
interface ValidationSchemaConfig {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}

/**
 * Validation error detail
 */
interface ValidationError {
    field: string;
    message: string;
    code: string;
}

/**
 * Result of validation
 */
interface ValidationResult {
    success: boolean;
    data?: unknown;
    errors?: ValidationError[];
}

/**
 * Parse request body as JSON
 */
async function parseBody(request: Request): Promise<unknown> {
    try {
        const contentType = request.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            return await request.json();
        }

        return {};
    } catch {
        return {};
    }
}

/**
 * Parse query parameters from URL
 */
function parseQuery(url: URL): Record<string, string> {
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
        query[key] = value;
    });
    return query;
}

/**
 * Validate request using Zod schema
 */
export async function validateRequest(
    request: Request,
    url: URL,
    params: Record<string, string>,
    schema: ZodSchema | ValidationSchemaConfig
): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    let validatedInput: Record<string, unknown> = {};

    const body = await parseBody(request);
    const query = parseQuery(url);

    // Handle simple schema (validates entire request object)
    if ('safeParse' in schema && typeof schema.safeParse === 'function') {
        const requestData = {
            body,
            params,
            query
        };

        const result = schema.safeParse(requestData);

        if (!result.success) {
            return {
                success: false,
                errors: result.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }))
            };
        }

        return {
            success: true,
            data: result.data
        };
    }

    // Handle complex schema configuration
    const config = schema as ValidationSchemaConfig;

    if (config.body) {
        const bodyResult = config.body.safeParse(body);
        if (!bodyResult.success) {
            errors.push(
                ...bodyResult.error.errors.map((err) => ({
                    field: `body.${err.path.join('.')}`,
                    message: err.message,
                    code: err.code
                }))
            );
        } else {
            validatedInput.body = bodyResult.data;
        }
    }

    if (config.params) {
        const paramsResult = config.params.safeParse(params);
        if (!paramsResult.success) {
            errors.push(
                ...paramsResult.error.errors.map((err) => ({
                    field: `params.${err.path.join('.')}`,
                    message: err.message,
                    code: err.code
                }))
            );
        } else {
            validatedInput = { ...validatedInput, ...paramsResult.data };
        }
    }

    if (config.query) {
        const queryResult = config.query.safeParse(query);
        if (!queryResult.success) {
            errors.push(
                ...queryResult.error.errors.map((err) => ({
                    field: `query.${err.path.join('.')}`,
                    message: err.message,
                    code: err.code
                }))
            );
        } else {
            validatedInput = { ...validatedInput, ...queryResult.data };
        }
    }

    if (errors.length > 0) {
        return { success: false, errors };
    }

    return { success: true, data: validatedInput };
}
