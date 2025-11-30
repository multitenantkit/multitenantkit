// =============================================================================
// Supabase-specific convenience functions
// =============================================================================

import { createSupabaseAuthService } from '@multitenantkit/adapter-auth-supabase';
import { buildExpressApp, buildExpressRouter } from '@multitenantkit/adapter-transport-express';
import { buildHandlers } from '@multitenantkit/api-handlers';
import {
    createPostgresAdapters,
    createSystemAdapters,
    createUseCases
} from '@multitenantkit/composition';
import type { ToolkitOptions, UserCustomFieldsConfig } from '@multitenantkit/domain-contracts';
import type { Express, Router } from 'express';

/**
 * Merges user-provided ToolkitOptions with Supabase-specific defaults.
 *
 * Supabase defaults applied:
 * - namingStrategy: 'snake_case'
 * - users.database: { schema: 'auth', table: 'users' }
 * - users.customFields.columnMapping: { externalId: 'id', username: 'email' }
 * - users.customFields.customMapper: maps to/from raw_user_meta_data
 * - organizations.database: { schema: 'public', table: 'organizations' }
 * - organizationMemberships.database: { schema: 'public', table: 'organization_memberships' }
 *
 * User-provided options take precedence over defaults.
 */
function applySupabaseDefaults<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
>(
    options?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): ToolkitOptions<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    // Default Supabase customMapper for users (maps to raw_user_meta_data)
    const supabaseUserMapper = {
        toDb: (fields: any) => ({
            raw_user_meta_data: {
                sub: fields.id,
                email: fields.email,
                ...fields,
                email_verified: true,
                phone_verified: false
            }
        }),
        toDomain: (dbRow: any) => {
            const metadata = dbRow.raw_user_meta_data || {};
            // biome-ignore lint/correctness/noUnusedVariables: these fields are intentionally extracted to exclude them
            const { sub, email_verified, phone_verified, ...customFields } = metadata;
            return customFields;
        }
    };

    // Default Supabase columnMapping for users
    const supabaseUserColumnMapping = {
        externalId: 'id',
        username: 'email'
    };

    // Build users config with Supabase defaults
    const usersConfig = {
        customFields: {
            // User's customSchema if provided
            ...(options?.users?.customFields?.customSchema && {
                customSchema: options.users.customFields.customSchema
            }),
            // Use user's columnMapping or Supabase default
            columnMapping: options?.users?.customFields?.columnMapping ?? supabaseUserColumnMapping,
            // Use user's customMapper or Supabase default (only if customSchema is provided)
            ...(options?.users?.customFields?.customSchema && {
                customMapper: options?.users?.customFields?.customMapper ?? supabaseUserMapper
            })
        } as UserCustomFieldsConfig<TUserCustomFields>,
        database: {
            schema: options?.users?.database?.schema ?? 'auth',
            table: options?.users?.database?.table ?? 'users',
            ...(options?.users?.database?.namingStrategy && {
                namingStrategy: options.users.database.namingStrategy
            })
        }
    };

    // Build organizations config with Supabase defaults
    const organizationsConfig = {
        ...(options?.organizations?.customFields && {
            customFields: options.organizations.customFields
        }),
        database: {
            schema: options?.organizations?.database?.schema ?? 'public',
            table: options?.organizations?.database?.table ?? 'organizations',
            ...(options?.organizations?.database?.namingStrategy && {
                namingStrategy: options.organizations.database.namingStrategy
            })
        }
    };

    // Build organization memberships config with Supabase defaults
    const organizationMembershipsConfig = {
        ...(options?.organizationMemberships?.customFields && {
            customFields: options.organizationMemberships.customFields
        }),
        database: {
            schema: options?.organizationMemberships?.database?.schema ?? 'public',
            table: options?.organizationMemberships?.database?.table ?? 'organization_memberships',
            ...(options?.organizationMemberships?.database?.namingStrategy && {
                namingStrategy: options.organizationMemberships.database.namingStrategy
            })
        }
    };

    return {
        namingStrategy: options?.namingStrategy ?? 'snake_case',
        users: usersConfig,
        organizations: organizationsConfig,
        organizationMemberships: organizationMembershipsConfig,
        // Pass through other options as-is
        ...(options?.useCaseHooks && { useCaseHooks: options.useCaseHooks }),
        ...(options?.responseTransformers && { responseTransformers: options.responseTransformers })
    };
}

/**
 * Create a complete Express application with Supabase defaults
 *
 * This convenience function sets up a fully configured Express app with:
 * - PostgreSQL persistence
 * - Supabase authentication
 * - Pre-configured Supabase defaults (auth.users, raw_user_meta_data, etc.)
 * - All MultiTenantKit routes and middleware
 *
 * Accepts standard ToolkitOptions and applies Supabase-specific defaults.
 * User-provided options take precedence over defaults.
 *
 * @template TUserCustomFields - Custom fields schema for Users
 * @template TOrganizationCustomFields - Custom fields schema for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields schema for Organization Memberships
 *
 * @param options - ToolkitOptions with Supabase defaults applied automatically
 * @returns Express application ready to listen on a port
 *
 * @example
 * ```typescript
 * // Minimal setup - no custom fields
 * import { createSupabaseExpressApp } from '@multitenantkit/sdk';
 *
 * const app = createSupabaseExpressApp();
 * app.listen(3000);
 * ```
 *
 * @example
 * ```typescript
 * // With custom fields and hooks
 * import { createSupabaseExpressApp } from '@multitenantkit/sdk';
 * import { z } from 'zod';
 *
 * const app = createSupabaseExpressApp({
 *   users: {
 *     customFields: {
 *       customSchema: z.object({
 *         firstName: z.string(),
 *         lastName: z.string()
 *       })
 *     }
 *   },
 *   useCaseHooks: {
 *     CreateUser: {
 *       onSuccess: async ({ stepResults }) => {
 *         await sendWelcomeEmail(stepResults.output.email);
 *       }
 *     }
 *   }
 * });
 *
 * app.listen(3000);
 * ```
 */
export function createSupabaseExpressApp<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    options?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): Express {
    const toolkitOptions = applySupabaseDefaults(options);

    // 1. Create persistence adapters (PostgreSQL)
    const persistenceAdapters = createPostgresAdapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(undefined, toolkitOptions);

    // 2. Create system and metrics adapters
    const systemAdapters = createSystemAdapters();

    // 3. Create use cases with all adapters
    const useCases = createUseCases<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(
        {
            persistence: persistenceAdapters,
            system: systemAdapters
        },
        toolkitOptions
    );

    // 4. Build HTTP handlers
    const handlers = buildHandlers<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(useCases, toolkitOptions);

    // 5. Create Supabase auth service
    const authService = createSupabaseAuthService();

    // 6. Build Express app with all middleware and routes
    const app = buildExpressApp(handlers, authService);

    return app;
}

/**
 * Create an Express Router with Supabase defaults
 *
 * Use this when you want to integrate MultiTenantKit into an existing Express application.
 * The router can be mounted at any path in your app.
 *
 * Accepts standard ToolkitOptions and applies Supabase-specific defaults.
 * User-provided options take precedence over defaults.
 *
 * @template TUserCustomFields - Custom fields schema for Users
 * @template TOrganizationCustomFields - Custom fields schema for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields schema for Organization Memberships
 *
 * @param options - ToolkitOptions with Supabase defaults applied automatically
 * @returns Express Router with all MultiTenantKit routes
 *
 * @example
 * ```typescript
 * // Add to existing Express app
 * import express from 'express';
 * import { createSupabaseExpressRouter } from '@multitenantkit/sdk';
 *
 * const app = express();
 *
 * // Your existing routes
 * app.get('/api/billing', billingHandler);
 *
 * // Add MultiTenantKit routes under /api/teams
 * const teamsRouter = createSupabaseExpressRouter();
 * app.use('/api/teams', teamsRouter);
 *
 * app.listen(3000);
 * ```
 *
 * @example
 * ```typescript
 * // With custom fields
 * import { createSupabaseExpressRouter } from '@multitenantkit/sdk';
 * import { z } from 'zod';
 *
 * const router = createSupabaseExpressRouter({
 *   users: {
 *     customFields: {
 *       customSchema: z.object({
 *         firstName: z.string(),
 *         lastName: z.string()
 *       })
 *     }
 *   }
 * });
 * ```
 */
export function createSupabaseExpressRouter<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    options?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): Router {
    const toolkitOptions = applySupabaseDefaults(options);

    // 1. Create persistence adapters (PostgreSQL)
    const persistenceAdapters = createPostgresAdapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(undefined, toolkitOptions);

    // 2. Create system and metrics adapters
    const systemAdapters = createSystemAdapters();

    // 3. Create use cases with all adapters
    const useCases = createUseCases<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(
        {
            persistence: persistenceAdapters,
            system: systemAdapters
        },
        toolkitOptions
    );

    // 4. Build HTTP handlers
    const handlers = buildHandlers<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(useCases, toolkitOptions);

    // 5. Create Supabase auth service
    const authService = createSupabaseAuthService();

    // 6. Build Express router with routes only (no global middleware)
    const router = buildExpressRouter(handlers, authService);

    return router;
}

/**
 * Create use cases with Supabase defaults
 *
 * Use this when you want to use MultiTenantKit use cases directly without Express.
 * Useful for background jobs, CLI tools, or custom transport layers.
 *
 * Accepts standard ToolkitOptions and applies Supabase-specific defaults.
 * User-provided options take precedence over defaults.
 *
 * @template TUserCustomFields - Custom fields schema for Users
 * @template TOrganizationCustomFields - Custom fields schema for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields schema for Organization Memberships
 *
 * @param options - ToolkitOptions with Supabase defaults applied automatically
 * @returns Configured use cases ready to execute
 *
 * @example
 * ```typescript
 * // Create use cases for background job
 * import { createSupabaseUseCases } from '@multitenantkit/sdk';
 * import { z } from 'zod';
 *
 * const useCases = createSupabaseUseCases({
 *   users: {
 *     customFields: {
 *       customSchema: z.object({
 *         firstName: z.string(),
 *         lastName: z.string()
 *       })
 *     }
 *   }
 * });
 *
 * // Use in background job
 * const result = await useCases.users.getUser.execute({
 *   userId: 'user-123',
 *   requestId: crypto.randomUUID(),
 *   actorUserId: 'system'
 * });
 * ```
 */
export function createSupabaseUseCases<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    options?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): ReturnType<
    typeof createUseCases<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
> {
    const toolkitOptions = applySupabaseDefaults(options);

    // 1. Create persistence adapters (PostgreSQL)
    const persistenceAdapters = createPostgresAdapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(undefined, toolkitOptions);

    // 2. Create system and metrics adapters
    const systemAdapters = createSystemAdapters();

    // 3. Create and return use cases
    const useCases = createUseCases<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >(
        {
            persistence: persistenceAdapters,
            system: systemAdapters
        },
        toolkitOptions
    );

    return useCases;
}
