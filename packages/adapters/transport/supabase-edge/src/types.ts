// Types specific to Supabase Edge Functions adapter

import type { Principal } from '@multitenantkit/domain-contracts/shared/auth';

/**
 * Context passed through the Edge Function pipeline
 */
export interface EdgeContext {
    request: Request;
    requestId: string;
    principal: Principal | null;
    params: Record<string, string>;
    query: Record<string, string>;
    body: unknown;
}

/**
 * CORS configuration options
 */
export interface CorsOptions {
    allowOrigin: string | string[];
    allowHeaders: string[];
    allowMethods: string[];
    maxAge?: number;
}

/**
 * Edge Function builder options
 */
export interface EdgeFunctionOptions {
    /** Base path prefix for all routes (usually the function name) */
    basePath: string;
    /** CORS configuration */
    cors?: CorsOptions;
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * Internal route match result
 */
export interface RouteMatch {
    handler: unknown;
    params: Record<string, string>;
}
