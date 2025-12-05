// Main builder for Supabase Edge Functions handler

import type { AuthService } from '@multitenantkit/api-contracts/shared/ports';
import type { HandlerPackage } from '@multitenantkit/api-handlers';
import { ANONYMOUS_PRINCIPAL } from '@multitenantkit/domain-contracts/shared/auth';

import { authenticateRequest } from './middleware/auth';
import { buildCorsHeaders, handleCorsPreflightRequest } from './middleware/cors';
import { getRequestId } from './middleware/requestId';
import { validateRequest } from './middleware/validation';
import { EdgeRouter } from './router';
import type { CorsOptions, EdgeFunctionOptions } from './types';

/**
 * Default CORS configuration
 */
const DEFAULT_CORS: CorsOptions = {
    allowOrigin: '*',
    allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-request-id'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

/**
 * Default options for Edge Function
 */
const DEFAULT_OPTIONS: Partial<EdgeFunctionOptions> = {
    cors: DEFAULT_CORS,
    debug: false
};

/**
 * Build error response with consistent format
 */
function buildErrorResponse(
    status: number,
    code: string,
    message: string,
    requestId: string,
    corsHeaders: Record<string, string>,
    details?: Record<string, unknown>
): Response {
    const errorBody: Record<string, unknown> = {
        code,
        message,
        requestId,
        timestamp: new Date().toISOString()
    };

    if (details) {
        errorBody.details = details;
    }

    return new Response(
        JSON.stringify({
            error: errorBody
        }),
        {
            status,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                ...corsHeaders
            }
        }
    );
}

/**
 * Build the Edge Function handler from HandlerPackages
 *
 * This function creates a Deno.serve() compatible handler that:
 * - Routes requests to appropriate handlers
 * - Handles CORS
 * - Authenticates requests
 * - Validates input
 * - Returns consistent responses
 *
 * @param handlers - Array of HandlerPackages from api-handlers
 * @param authService - AuthService implementation (e.g., SupabaseAuthService)
 * @param options - Configuration options
 * @returns Handler function for Deno.serve()
 *
 * @example
 * ```typescript
 * const handler = buildEdgeFunction(handlers, authService, {
 *     basePath: '/multitenantkit'
 * });
 *
 * Deno.serve(handler);
 * ```
 */
export function buildEdgeFunction(
    handlers: HandlerPackage<unknown, unknown>[],
    authService: AuthService<unknown>,
    options: EdgeFunctionOptions
): (request: Request) => Promise<Response> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const corsConfig = opts.cors ?? DEFAULT_CORS;
    const corsHeaders = buildCorsHeaders(corsConfig);
    const router = new EdgeRouter(opts.basePath, handlers);

    return async (request: Request): Promise<Response> => {
        const requestId = getRequestId(request);

        try {
            // Handle CORS preflight
            if (request.method === 'OPTIONS') {
                return handleCorsPreflightRequest(corsHeaders);
            }

            const url = new URL(request.url);
            const pathname = url.pathname;
            const method = request.method;

            if (opts.debug) {
                console.log(`📍 ${method} ${pathname} [${requestId}]`);
            }

            // Health check endpoint
            if (pathname === `${opts.basePath}/health` && method === 'GET') {
                return new Response(
                    JSON.stringify({
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        requestId
                    }),
                    {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Request-ID': requestId,
                            ...corsHeaders
                        }
                    }
                );
            }

            // Route matching
            const routeMatch = router.match(method, pathname);

            if (!routeMatch) {
                return buildErrorResponse(
                    404,
                    'NOT_FOUND',
                    `Route ${method} ${pathname} not found`,
                    requestId,
                    corsHeaders
                );
            }

            const { handler: pkg, params } = routeMatch;
            const handlerPackage = pkg as HandlerPackage<unknown, unknown>;
            const { route, schema, handler } = handlerPackage;

            // Authentication
            let principal = ANONYMOUS_PRINCIPAL;

            if (route.auth === 'required' || route.auth === 'optional') {
                principal = await authenticateRequest(request, authService);

                // If auth is required but we got anonymous, return 401
                if (route.auth === 'required' && principal === ANONYMOUS_PRINCIPAL) {
                    return buildErrorResponse(
                        401,
                        'UNAUTHORIZED',
                        'Authentication required',
                        requestId,
                        corsHeaders
                    );
                }
            }

            // Validation
            const validationResult = await validateRequest(request, url, params, schema);

            if (!validationResult.success) {
                return buildErrorResponse(
                    400,
                    'VALIDATION_ERROR',
                    'Request validation failed',
                    requestId,
                    corsHeaders,
                    { issues: validationResult.errors }
                );
            }

            // Execute handler
            const result = await handler({
                input: validationResult.data,
                principal,
                requestId
            });

            // Build response
            const responseHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                ...corsHeaders,
                ...(result.headers || {})
            };

            return new Response(JSON.stringify(result.body), {
                status: result.status,
                headers: responseHeaders
            });
        } catch (error) {
            console.error('Edge Function error:', error);

            return buildErrorResponse(
                500,
                'INTERNAL_SERVER_ERROR',
                'An unexpected error occurred',
                requestId,
                corsHeaders
            );
        }
    };
}
