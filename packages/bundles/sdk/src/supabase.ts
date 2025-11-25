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
import type {
    OrganizationCustomFieldsConfig,
    OrganizationMembershipCustomFieldsConfig,
    ToolkitOptions,
    UserCustomFieldsConfig
} from '@multitenantkit/domain-contracts';
import type { Express, Router } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Simplified custom fields configuration for Supabase users
 * Only requires the schema, everything else is pre-configured
 */
export interface SupabaseUserCustomFieldsConfig<TCustomFields> {
    /**
     * Zod schema defining custom fields structure
     */
    customSchema: ZodSchema<TCustomFields>;
}

export interface SupabaseOrganizationCustomFieldsConfig<TCustomFields> {
    /**
     * Zod schema defining custom fields structure
     */
    customSchema: ZodSchema<TCustomFields>;
}

export interface SupabaseOrganizationMembershipCustomFieldsConfig<TCustomFields> {
    /**
     * Zod schema defining custom fields structure
     */
    customSchema: ZodSchema<TCustomFields>;
}

/**
 * Simplified toolkit options for Supabase
 * Pre-configures common Supabase defaults
 */
export interface SupabaseToolkitOptions<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
> {
    /**
     * Optional naming strategy (defaults to snake_case for Supabase/PostgreSQL)
     */
    namingStrategy?: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';

    /**
     * Users configuration (optional, uses Supabase defaults)
     */
    users?: {
        customFields?: SupabaseUserCustomFieldsConfig<TUserCustomFields>;
    };

    /**
     * Organizations configuration (optional, uses Supabase defaults)
     */
    organizations?: {
        customFields?: SupabaseOrganizationCustomFieldsConfig<TOrganizationCustomFields>;
    };

    /**
     * Organization memberships configuration (optional, uses Supabase defaults)
     */
    organizationMemberships?: {
        customFields?: SupabaseOrganizationMembershipCustomFieldsConfig<TOrganizationMembershipCustomFields>;
    };
}

/**
 * Converts simplified Supabase options to full ToolkitOptions
 * Applies Supabase-specific defaults
 */
function buildSupabaseToolkitOptions<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
>(
    options?: SupabaseToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): ToolkitOptions<
    TUserCustomFields,
    TOrganizationCustomFields,
    TOrganizationMembershipCustomFields
> {
    const toolkitOptions: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    > = {
        namingStrategy: options?.namingStrategy ?? 'snake_case'
    };

    // Configure users with Supabase defaults
    if (options?.users?.customFields) {
        const userCustomFieldsConfig: UserCustomFieldsConfig<TUserCustomFields> = {
            customSchema: options.users.customFields.customSchema,
            // Map to Supabase's raw_user_meta_data column
            customMapper: {
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
            },
            // Map base fields to Supabase columns
            columnMapping: {
                externalId: 'id',
                username: 'email'
            }
        };

        toolkitOptions.users = {
            customFields: userCustomFieldsConfig,
            database: {
                schema: 'auth',
                table: 'users'
            }
        };
    } else {
        // No custom fields, but still configure Supabase defaults for users
        toolkitOptions.users = {
            customFields: {
                columnMapping: {
                    externalId: 'id',
                    username: 'email'
                }
            } as UserCustomFieldsConfig<TUserCustomFields>,
            database: {
                schema: 'auth',
                table: 'users'
            }
        };
    }

    // Configure organizations with Supabase defaults
    if (options?.organizations?.customFields) {
        const orgCustomFieldsConfig: OrganizationCustomFieldsConfig<TOrganizationCustomFields> = {
            customSchema: options.organizations.customFields.customSchema
        };

        toolkitOptions.organizations = {
            customFields: orgCustomFieldsConfig,
            database: {
                schema: 'public',
                table: 'organizations'
            }
        };
    } else {
        // No custom fields, but still configure database defaults
        toolkitOptions.organizations = {
            database: {
                schema: 'public',
                table: 'organizations'
            }
        };
    }

    // Configure organization memberships with Supabase defaults
    if (options?.organizationMemberships?.customFields) {
        const membershipCustomFieldsConfig: OrganizationMembershipCustomFieldsConfig<TOrganizationMembershipCustomFields> =
            {
                customSchema: options.organizationMemberships.customFields.customSchema
            };

        toolkitOptions.organizationMemberships = {
            customFields: membershipCustomFieldsConfig,
            database: {
                schema: 'public',
                table: 'organization_memberships'
            }
        };
    } else {
        // No custom fields, but still configure database defaults
        toolkitOptions.organizationMemberships = {
            database: {
                schema: 'public',
                table: 'organization_memberships'
            }
        };
    }

    return toolkitOptions;
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
 * @template TUserCustomFields - Custom fields schema for Users
 * @template TOrganizationCustomFields - Custom fields schema for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields schema for Organization Memberships
 *
 * @param options - Simplified Supabase toolkit options (only custom fields needed)
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
 * // With custom fields
 * import { createSupabaseExpressApp } from '@multitenantkit/sdk';
 * import { z } from 'zod';
 *
 * const app = createSupabaseExpressApp({
 *   users: {
 *     customFields: {
 *       customSchema: z.object({
 *         firstName: z.string(),
 *         lastName: z.string(),
 *         phone: z.string().optional()
 *       })
 *     }
 *   },
 *   organizations: {
 *     customFields: {
 *       customSchema: z.object({
 *         organizationName: z.string(),
 *         industry: z.string().optional(),
 *         size: z.string().optional()
 *       })
 *     }
 *   },
 *   organizationMemberships: {
 *     customFields: {
 *       customSchema: z.object({
 *         internalRole: z.string().optional()
 *       })
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
    options?: SupabaseToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): Express {
    const toolkitOptions = buildSupabaseToolkitOptions(options);

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
 * @template TUserCustomFields - Custom fields schema for Users
 * @template TOrganizationCustomFields - Custom fields schema for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields schema for Organization Memberships
 *
 * @param options - Simplified Supabase toolkit options (only custom fields needed)
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
    options?: SupabaseToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): Router {
    const toolkitOptions = buildSupabaseToolkitOptions(options);

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
 * @template TUserCustomFields - Custom fields schema for Users
 * @template TOrganizationCustomFields - Custom fields schema for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields schema for Organization Memberships
 *
 * @param options - Simplified Supabase toolkit options (only custom fields needed)
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
    options?: SupabaseToolkitOptions<
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
    const toolkitOptions = buildSupabaseToolkitOptions(options);

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
