/**
 * Types specific to Supabase Edge Functions adapter
 * @module
 */

import type { Principal } from '@multitenantkit/domain-contracts/shared/auth';

/**
 * Context passed through the Edge Function pipeline.
 * Contains all request information after parsing and authentication.
 */
export interface EdgeContext {
    /** The original Deno Request object */
    request: Request;
    /** Unique identifier for this request (from header or generated) */
    requestId: string;
    /** Authenticated principal, or null if not authenticated */
    principal: Principal | null;
    /** Path parameters extracted from the URL (e.g., { id: '123' }) */
    params: Record<string, string>;
    /** Query parameters from the URL */
    query: Record<string, string>;
    /** Parsed request body */
    body: unknown;
}

/**
 * CORS (Cross-Origin Resource Sharing) configuration options.
 *
 * @example
 * ```typescript
 * const cors: CorsOptions = {
 *     allowOrigin: 'https://myapp.com',
 *     allowHeaders: ['authorization', 'content-type'],
 *     allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
 *     maxAge: 86400 // 24 hours
 * };
 * ```
 */
export interface CorsOptions {
    /** Allowed origins - can be '*' for all, a single origin, or array of origins */
    allowOrigin: string | string[];
    /** Headers that can be used in the actual request */
    allowHeaders: string[];
    /** HTTP methods allowed when accessing the resource */
    allowMethods: string[];
    /** How long (in seconds) the results of a preflight request can be cached */
    maxAge?: number;
}

/**
 * Configuration options for the Edge Function builder.
 *
 * @example
 * ```typescript
 * const options: EdgeFunctionOptions = {
 *     basePath: '/multitenantkit',
 *     cors: {
 *         allowOrigin: '*',
 *         allowHeaders: ['authorization', 'content-type'],
 *         allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
 *     },
 *     debug: true
 * };
 * ```
 */
export interface EdgeFunctionOptions {
    /**
     * Base path prefix for all routes.
     * This is typically the Edge Function name (e.g., '/multitenantkit').
     * All handler routes will be prefixed with this path.
     */
    basePath: string;
    /**
     * CORS configuration. If not provided, defaults to allowing all origins.
     */
    cors?: CorsOptions;
    /**
     * Enable debug logging. Logs request method, path, and requestId.
     * @default false
     */
    debug?: boolean;
}

/**
 * Result of matching a request to a registered route.
 * Used internally by the router.
 */
export interface RouteMatch {
    /** The matched HandlerPackage */
    handler: unknown;
    /** Extracted path parameters */
    params: Record<string, string>;
}
