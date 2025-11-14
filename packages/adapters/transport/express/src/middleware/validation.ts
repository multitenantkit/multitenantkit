import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Validation schema configuration for different parts of the request
 */
interface ValidationSchemaConfig {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}

/**
 * Express middleware for request validation using Zod schemas
 * Supports validation of body, params, and query parameters
 */
export function validateRequest(schema: ZodSchema | ValidationSchemaConfig) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            let validatedInput: any = {};
            const errors: any[] = [];

            // Handle simple schema (body only) for backward compatibility
            if ('safeParse' in schema) {
                const validationResult = schema.safeParse(req);
                if (!validationResult.success) {
                    errors.push(...validationResult.error.errors);
                } else {
                    validatedInput = validationResult.data;
                }
            } else {
                // Handle complex schema configuration
                const config = schema as ValidationSchemaConfig;

                // Validate body
                if (config.body) {
                    const bodyResult = config.body.safeParse(req.body);
                    if (!bodyResult.success) {
                        errors.push(
                            ...bodyResult.error.errors.map((err) => ({
                                ...err,
                                path: ['body', ...err.path]
                            }))
                        );
                    } else {
                        validatedInput.body = bodyResult.data;
                    }
                }

                // Validate params
                if (config.params) {
                    const paramsResult = config.params.safeParse(req.params);
                    if (!paramsResult.success) {
                        errors.push(
                            ...paramsResult.error.errors.map((err) => ({
                                ...err,
                                path: ['params', ...err.path]
                            }))
                        );
                    } else {
                        validatedInput = {
                            ...validatedInput,
                            ...paramsResult.data
                        };
                    }
                }

                // Validate query
                if (config.query) {
                    const queryResult = config.query.safeParse(req.query);
                    if (!queryResult.success) {
                        errors.push(
                            ...queryResult.error.errors.map((err) => ({
                                ...err,
                                path: ['query', ...err.path]
                            }))
                        );
                    } else {
                        validatedInput = {
                            ...validatedInput,
                            ...queryResult.data
                        };
                    }
                }
            }

            // If there are validation errors, return them
            if (errors.length > 0) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request validation failed',
                        details: {
                            issues: errors.map((issue) => ({
                                field: issue.path.join('.'),
                                message: issue.message,
                                code: issue.code
                            }))
                        }
                    }
                });
            }
            // Add validated data to request
            req.validatedInput = validatedInput;
            next();
        } catch (error) {
            return res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Validation middleware failed',
                    details: {
                        originalError: (error as Error).message
                    }
                }
            });
        }
    };
}

// Extend Express Request type to include validated input
declare global {
    namespace Express {
        interface Request {
            validatedBody?: any; // Keep for backward compatibility
            validatedInput?: any;
        }
    }
}
