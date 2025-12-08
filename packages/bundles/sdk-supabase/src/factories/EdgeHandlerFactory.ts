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
 * // Simplest usage - zero configuration!
 * import { createSupabaseEdgeHandler } from '@multitenantkit/sdk-supabase';
 *
 * const handler = createSupabaseEdgeHandler();
 * Deno.serve(handler);
 *
 * // With custom fields
 * const handler = createSupabaseEdgeHandler({
 *     toolkitOptions: {
 *         users: { customFields: { customSchema: userSchema } }
 *     }
 * });
 *
 * // With edge options
 * const handler = createSupabaseEdgeHandler({
 *     edgeOptions: {
 *         basePath: '/multitenantkit',
 *         cors: { allowOrigin: 'https://myapp.com', ... }
 *     }
 * });
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
    const { toolkitOptions: userToolkitOptions, edgeOptions } = options ?? {};

    // 1. Create adapters (auto-creates Supabase client from env vars)
    const { adapters, toolkitOptions, client } = createSupabaseAdapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >({ toolkitOptions: userToolkitOptions });

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
