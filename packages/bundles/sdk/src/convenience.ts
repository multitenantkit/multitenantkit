// =============================================================================
// Convenience functions for quick setup
// =============================================================================

import { createSupabaseAuthService } from '@multitenantkit/adapter-auth-supabase';
import { buildExpressApp, buildExpressRouter } from '@multitenantkit/adapter-transport-express';
import { buildHandlers } from '@multitenantkit/api-handlers';
import {
    createJsonAdapters,
    createMetricsAdapter,
    createPostgresAdapters,
    createSystemAdapters,
    createUseCases
} from '@multitenantkit/composition';
import type { ToolkitOptions } from '@multitenantkit/domain-contracts';
import type { Express, Router } from 'express';

/**
 * Infrastructure adapter options
 * Allows specifying which adapters to use via string presets or custom implementations
 */
export interface InfrastructureOptions {
    /**
     * Persistence adapter to use
     * - 'postgres': PostgreSQL (default)
     * - 'json': JSON file storage (development only)
     * - Custom: Provide your own adapter factory
     */
    persistence?: 'postgres' | 'json';

    /**
     * Authentication adapter to use
     * - 'supabase': Supabase Auth (default)
     * - Custom: Provide your own auth service factory
     */
    auth?: 'supabase';
}

/**
 * Detects which parameter is which based on their properties
 * This allows calling the function with parameters in any order
 */
function resolveParameters<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
>(
    param1?:
        | ToolkitOptions<
              TUserCustomFields,
              TOrganizationCustomFields,
              TOrganizationMembershipCustomFields
          >
        | InfrastructureOptions,
    param2?:
        | ToolkitOptions<
              TUserCustomFields,
              TOrganizationCustomFields,
              TOrganizationMembershipCustomFields
          >
        | InfrastructureOptions
): {
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
    infraOptions?: InfrastructureOptions;
} {
    if (!param1 && !param2) {
        return { toolkitOptions: undefined, infraOptions: undefined };
    }

    // Helper to detect if an object is InfrastructureOptions
    const isInfraOptions = (obj: any): obj is InfrastructureOptions => {
        return obj && (obj.persistence !== undefined || obj.auth !== undefined);
    };

    // Only one parameter provided
    if (!param2) {
        if (isInfraOptions(param1)) {
            return { infraOptions: param1, toolkitOptions: undefined };
        }
        return {
            toolkitOptions: param1 as ToolkitOptions<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >,
            infraOptions: undefined
        };
    }

    // Two parameters provided - detect order
    if (isInfraOptions(param1)) {
        return {
            infraOptions: param1,
            toolkitOptions: param2 as ToolkitOptions<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        };
    } else {
        return {
            toolkitOptions: param1 as ToolkitOptions<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >,
            infraOptions: isInfraOptions(param2) ? param2 : undefined
        };
    }
}

/**
 * Create a complete Express application with MultiTenantKit
 *
 * This convenience function sets up a fully configured Express app with:
 * - PostgreSQL persistence (default) or JSON for development
 * - Supabase authentication (default)
 * - All MultiTenantKit routes and middleware
 *
 * Parameters can be provided in any order for convenience.
 *
 * @template TUserCustomFields - Custom fields schema for Users
 * @template TOrganizationCustomFields - Custom fields schema for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields schema for Organization Memberships
 *
 * @param param1 - Either ToolkitOptions or InfrastructureOptions
 * @param param2 - Either ToolkitOptions or InfrastructureOptions (whichever wasn't param1)
 * @returns Express application ready to listen on a port
 *
 * @example
 * ```typescript
 * // Minimal setup with defaults (Postgres + Supabase)
 * import { createExpressApp } from '@multitenantkit/sdk';
 *
 * const app = createExpressApp();
 * app.listen(3000);
 * ```
 *
 * @example
 * ```typescript
 * // With custom fields
 * import { createExpressApp } from '@multitenantkit/sdk';
 * import { z } from 'zod';
 *
 * const app = createExpressApp({
 *   namingStrategy: 'snake_case',
 *   users: {
 *     customFields: {
 *       customSchema: z.object({
 *         firstName: z.string(),
 *         lastName: z.string(),
 *         email: z.string().email()
 *       })
 *     }
 *   }
 * });
 *
 * app.listen(3000);
 * ```
 *
 * @example
 * ```typescript
 * // With custom infrastructure (parameters in any order)
 * const app = createExpressApp(
 *   { persistence: 'json', auth: 'supabase' },
 *   { namingStrategy: 'snake_case' }
 * );
 *
 * // Or reversed order - same result
 * const app = createExpressApp(
 *   { namingStrategy: 'snake_case' },
 *   { persistence: 'json' }
 * );
 * ```
 */
export function createExpressApp<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    param1?:
        | ToolkitOptions<
              TUserCustomFields,
              TOrganizationCustomFields,
              TOrganizationMembershipCustomFields
          >
        | InfrastructureOptions,
    param2?:
        | ToolkitOptions<
              TUserCustomFields,
              TOrganizationCustomFields,
              TOrganizationMembershipCustomFields
          >
        | InfrastructureOptions
): Express {
    const { toolkitOptions, infraOptions } = resolveParameters(param1, param2);

    // Apply defaults for infrastructure
    const persistenceType = infraOptions?.persistence ?? 'postgres';
    const authType = infraOptions?.auth ?? 'supabase';

    // 1. Create persistence adapters based on selected type
    const persistenceAdapters =
        persistenceType === 'json'
            ? createJsonAdapters<
                  TUserCustomFields,
                  TOrganizationCustomFields,
                  TOrganizationMembershipCustomFields
              >(process.env.JSON_DATA_DIR ?? './data')
            : createPostgresAdapters<
                  TUserCustomFields,
                  TOrganizationCustomFields,
                  TOrganizationMembershipCustomFields
              >(undefined, toolkitOptions);

    // 2. Create system and metrics adapters
    const systemAdapters = createSystemAdapters();
    const metricsAdapter = createMetricsAdapter();

    // 3. Create use cases with all adapters
    const useCases = createUseCases<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(
        {
            persistence: persistenceAdapters,
            system: systemAdapters,
            observability: metricsAdapter
        },
        toolkitOptions
    );

    // 4. Build HTTP handlers
    const handlers = buildHandlers<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(useCases, toolkitOptions);

    // 5. Create auth service based on selection
    const authService =
        authType === 'supabase' ? createSupabaseAuthService() : createSupabaseAuthService();

    // 6. Build Express app with all middleware and routes
    const app = buildExpressApp(handlers, authService);

    return app;
}

/**
 * Create an Express Router with MultiTenantKit routes
 *
 * Use this when you want to integrate MultiTenantKit into an existing Express application.
 * The router can be mounted at any path in your app.
 *
 * Parameters can be provided in any order for convenience.
 *
 * @template TUserCustomFields - Custom fields schema for Users
 * @template TOrganizationCustomFields - Custom fields schema for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields schema for Organization Memberships
 *
 * @param param1 - Either ToolkitOptions or InfrastructureOptions
 * @param param2 - Either ToolkitOptions or InfrastructureOptions (whichever wasn't param1)
 * @returns Express Router with all MultiTenantKit routes
 *
 * @example
 * ```typescript
 * // Add to existing Express app
 * import express from 'express';
 * import { createExpressRouter } from '@multitenantkit/sdk';
 *
 * const app = express();
 *
 * // Your existing routes
 * app.get('/api/billing', billingHandler);
 *
 * // Add MultiTenantKit routes under /api/teams
 * const teamsRouter = createExpressRouter();
 * app.use('/api/teams', teamsRouter);
 *
 * app.listen(3000);
 * ```
 *
 * @example
 * ```typescript
 * // With custom configuration (parameters in any order)
 * const router = createExpressRouter(
 *   { persistence: 'postgres', auth: 'supabase' },
 *   { namingStrategy: 'snake_case' }
 * );
 *
 * // Or reversed
 * const router = createExpressRouter(
 *   { namingStrategy: 'snake_case' },
 *   { persistence: 'postgres' }
 * );
 * ```
 */
export function createExpressRouter<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    param1?:
        | ToolkitOptions<
              TUserCustomFields,
              TOrganizationCustomFields,
              TOrganizationMembershipCustomFields
          >
        | InfrastructureOptions,
    param2?:
        | ToolkitOptions<
              TUserCustomFields,
              TOrganizationCustomFields,
              TOrganizationMembershipCustomFields
          >
        | InfrastructureOptions
): Router {
    const { toolkitOptions, infraOptions } = resolveParameters(param1, param2);

    // Apply defaults for infrastructure
    const persistenceType = infraOptions?.persistence ?? 'postgres';
    const authType = infraOptions?.auth ?? 'supabase';

    // 1. Create persistence adapters based on selected type
    const persistenceAdapters =
        persistenceType === 'json'
            ? createJsonAdapters<
                  TUserCustomFields,
                  TOrganizationCustomFields,
                  TOrganizationMembershipCustomFields
              >(process.env.JSON_DATA_DIR ?? './data')
            : createPostgresAdapters<
                  TUserCustomFields,
                  TOrganizationCustomFields,
                  TOrganizationMembershipCustomFields
              >(undefined, toolkitOptions);

    // 2. Create system and metrics adapters
    const systemAdapters = createSystemAdapters();
    const metricsAdapter = createMetricsAdapter();

    // 3. Create use cases with all adapters
    const useCases = createUseCases<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(
        {
            persistence: persistenceAdapters,
            system: systemAdapters,
            observability: metricsAdapter
        },
        toolkitOptions
    );

    // 4. Build HTTP handlers
    const handlers = buildHandlers<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(useCases, toolkitOptions);

    // 5. Create auth service based on selection
    const authService =
        authType === 'supabase' ? createSupabaseAuthService() : createSupabaseAuthService();

    // 6. Build Express router with routes only (no global middleware)
    const router = buildExpressRouter(handlers, authService);

    return router;
}
