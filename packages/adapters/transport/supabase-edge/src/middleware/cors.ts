// CORS Handler for Supabase Edge Functions

import type { CorsOptions } from '../types';

/**
 * Default CORS configuration
 */
const DEFAULT_CORS: CorsOptions = {
    allowOrigin: '*',
    allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-request-id'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

/**
 * Build CORS headers object
 */
export function buildCorsHeaders(options: CorsOptions = DEFAULT_CORS): Record<string, string> {
    const origin = Array.isArray(options.allowOrigin)
        ? options.allowOrigin.join(', ')
        : options.allowOrigin;

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': options.allowHeaders.join(', '),
        'Access-Control-Allow-Methods': options.allowMethods.join(', '),
        ...(options.maxAge && { 'Access-Control-Max-Age': String(options.maxAge) })
    };
}

/**
 * Handle CORS preflight (OPTIONS) request
 */
export function handleCorsPreflightRequest(corsHeaders: Record<string, string>): Response {
    return new Response('ok', { headers: corsHeaders });
}
