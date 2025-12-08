/**
 * @module @multitenantkit/adapter-transport-supabase-edge
 *
 * Supabase Edge Functions Transport Adapter for MultiTenantKit
 *
 * This adapter enables running MultiTenantKit API endpoints as a single
 * Supabase Edge Function with internal routing (the "fat function" pattern).
 *
 * @example
 * ```typescript
 * import { buildEdgeFunction } from '@multitenantkit/adapter-transport-supabase-edge';
 * import { buildHandlers } from '@multitenantkit/api-handlers';
 * import { SupabaseAuthService } from '@multitenantkit/adapter-auth-supabase';
 *
 * const handlers = buildHandlers(useCases);
 * const authService = new SupabaseAuthService({ supabaseUrl, supabaseServiceKey });
 *
 * const handler = buildEdgeFunction(handlers, authService, {
 *     basePath: '/multitenantkit'
 * });
 *
 * Deno.serve(handler);
 * ```
 */

// Main builder
export { buildEdgeFunction } from './buildEdgeFunction.js';
// Middleware utilities (for custom implementations)
export { authenticateRequest } from './middleware/auth.js';
export { buildCorsHeaders, handleCorsPreflightRequest } from './middleware/cors.js';
export { getRequestId } from './middleware/requestId.js';
export { validateRequest } from './middleware/validation.js';
// Router (for advanced use cases)
export { EdgeRouter } from './router.js';

// Types
export type { CorsOptions, EdgeContext, EdgeFunctionOptions, RouteMatch } from './types.js';
