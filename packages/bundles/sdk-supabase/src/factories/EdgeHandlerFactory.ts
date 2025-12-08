/**
 * Supabase Edge Handler Factory
 *
 * Creates a complete Edge Function handler with a single function call.
 * All configuration is optional - uses sensible defaults.
 */

import { SupabaseAuthService } from '@multitenantkit/adapter-auth-supabase';
import { buildEdgeFunction } from '@multitenantkit/adapter-transport-supabase-edge';
import { buildHandlers } from '@multitenantkit/api-handlers';
import type { ToolkitOptions } from '@multitenantkit/domain-contracts';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdapters } from './AdapterFactory';
import { createUseCases } from './UseCaseFactory';

/**
 * CORS configuration options for Edge Functions
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
 * Edge Function configuration options
 */
export interface EdgeOptions {
    /**
     * Base path prefix for all routes.
     * @default '/api'
     */
    basePath?: string;
    /**
     * CORS configuration.
     * @default Allows all origins with common headers
     */
    cors?: CorsOptions;
    /**
     * Enable debug logging.
     * @default false
     */
    debug?: boolean;
}

/**
 * Options for createSupabaseEdgeHandler
 */
export interface CreateSupabaseEdgeHandlerOptions<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    /**
     * Supabase client instance.
     * **IMPORTANT for Deno/esm.sh**: Pass a client created with createClient
     * imported directly from 'https://esm.sh/@supabase/supabase-js@2' to avoid
     * version conflicts with transitive dependencies.
     *
     * If not provided, will be auto-created from environment variables
     * (works in Node.js, may have issues in Deno via esm.sh).
     */
    client?: SupabaseClient;
    /**
     * Toolkit options for custom fields and configuration.
     * Supabase defaults are applied automatically.
     */
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
    /**
     * Edge Function configuration (basePath, cors, debug).
     * @default { basePath: '/api' }
     */
    edgeOptions?: EdgeOptions;
}

/**
 * Default CORS configuration for Edge Functions
 */
const DEFAULT_CORS: CorsOptions = {
    allowOrigin: '*',
    allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-request-id'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

/**
 * Create a complete Supabase Edge Function handler with a single call.
 *
 * This is the simplest way to set up MultiTenantKit for Supabase Edge Functions.
 * Everything is auto-configured from environment variables.
 *
 * **Environment variables required:**
 * - `SUPABASE_URL` or `PROJECT_URL`
 * - `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE_KEY`
 *
 * **Supabase defaults applied automatically:**
 * - `namingStrategy: 'snake_case'`
 * - `users.database: { schema: 'public', table: 'profiles' }`
 * - `organizations.database: { schema: 'public', table: 'organizations' }`
 * - `organizationMemberships.database: { schema: 'public', table: 'organization_memberships' }`
 *
 * @example
 * ```typescript
 * // For Deno/esm.sh - pass your own client to avoid version conflicts
 * import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 * import { createSupabaseEdgeHandler } from 'https://esm.sh/@multitenantkit/sdk-supabase';
 *
 * const client = createClient(
 *     Deno.env.get('PROJECT_URL')!,
 *     Deno.env.get('SERVICE_ROLE_KEY')!
 * );
 *
 * const handler = createSupabaseEdgeHandler({ client });
 * Deno.serve(handler);
 *
 * // With custom fields
 * const handler = createSupabaseEdgeHandler({
 *     client,
 *     toolkitOptions: {
 *         users: { customFields: { customSchema: userSchema } }
 *     }
 * });
 *
 * // Node.js - auto-creates client from env vars
 * const handler = createSupabaseEdgeHandler();
 * ```
 */
export function createSupabaseEdgeHandler<
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is the correct default
    TOrganizationMembershipCustomFields = {}
>(
    options?: CreateSupabaseEdgeHandlerOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): (request: Request) => Promise<Response> {
    const {
        client: providedClient,
        toolkitOptions: userToolkitOptions,
        edgeOptions
    } = options ?? {};

    // 1. Create adapters (uses provided client or auto-creates from env vars)
    const { adapters, toolkitOptions, client } = createSupabaseAdapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >({
        client: providedClient,
        toolkitOptions: userToolkitOptions
    });

    // 2. Create use cases
    const useCases = createUseCases(adapters, toolkitOptions);

    // 3. Build HTTP handlers
    const handlers = buildHandlers(useCases, toolkitOptions);

    // 4. Create auth service using the SAME client (avoids esm.sh version conflicts)
    const authService = new SupabaseAuthService({ client });

    // 5. Build Edge Function handler with defaults
    const handler = buildEdgeFunction(handlers, authService, {
        basePath: edgeOptions?.basePath ?? '/api',
        cors: edgeOptions?.cors ?? DEFAULT_CORS,
        debug: edgeOptions?.debug ?? false
    });

    return handler;
}
