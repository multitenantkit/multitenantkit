import type { OrganizationMembershipCustomFieldsConfig } from '../../organization-memberships';
import type { OrganizationCustomFieldsConfig } from '../../organizations';
import type { UserCustomFieldsConfig } from '../../users';
import type { UseCaseHooksConfig } from '../hooks/UseCaseHooksConfig';
import type { HandlerResponseTransformers } from './ResponseTransformer';

/**
 * toolkit options - Main entry point for customizing framework behavior
 * Organized by vertical slices (users, organizations, organizationMemberships, etc.)
 *
 * Architecture benefits:
 * - Vertical Slice: Each entity has its own isolated configuration
 * - Scalable: Easy to add new slices without changing signature
 * - Type-safe: Generic types ensure compile-time safety for custom fields
 * - Flexible: Each slice can have multiple config types (customFields, features, etc.)
 * - Maintainable: Configuration changes are localized per slice
 *
 * Generic parameters (all optional with {} default):
 * @template TUserCustomFields - Custom fields type for Users
 * @template TOrganizationCustomFields - Custom fields type for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields type for OrganizationMemberships (future)
 *
 * Example usage:
 * ```typescript
 * // Define your custom types
 * type MyUserFields = { address: string };
 * type MyOrganizationFields = { industry: string };
 * type MyMembershipFields = { role: string };
 *
 * // Single point of configuration with type safety
 * const config: ToolkitOptions<MyUserFields, MyOrganizationFields, MyMembershipFields> = {
 *     users: {
 *         customFields: userRepoConfig,  // TypeScript knows it's UserCustomFieldsConfig<MyUserFields>
 *     },
 *     organizations: {
 *         customFields: organizationRepoConfig,  // TypeScript knows it's OrganizationCustomFieldsConfig<MyOrganizationFields>
 *     },
 *     organizationMemberships: {
 *         customFields: membershipRepoConfig,  // TypeScript knows it's MembershipCustomFieldsConfig<MyMembershipFields>
 *     }
 * };
 * ```
 */
export interface ToolkitOptions<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
> {
    /**
     * Global naming strategy for custom fields (default for all entities)
     *
     * This sets the default naming convention for ALL entities (users, organizations, memberships).
     * Individual entities can override this in their database config.
     *
     * - 'camelCase' (default): No transformation
     *     firstName → firstName
     *
     * - 'snake_case': Convert to snake_case
     *     firstName → first_name
     *
     * - 'kebab-case': Convert to kebab-case
     *     firstName → first-name
     *
     * - 'PascalCase': Convert to PascalCase
     *     firstName → FirstName
     *
     * @example
     * ```typescript
     * const config: ToolkitOptions = {
     *     namingStrategy: 'snake_case', // ← One line for all entities!
     *     users: { customFields: { customSchema: userSchema } },
     *     organizations: { customFields: { customSchema: orgSchema } }
     * };
     * ```
     */
    namingStrategy?: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';

    /**
     * Users slice configuration
     */
    users?: {
        customFields?: UserCustomFieldsConfig<TUserCustomFields>;
        /**
         * Database configuration for users table
         */
        database?: {
            /**
             * Database schema name. If not provided, uses default schema.
             * Example: 'public', 'custom_schema'
             */
            schema?: string;
            /**
             * Table name for users. Default: 'users'
             */
            table?: string;
            /**
             * Naming strategy for custom fields (overrides global namingStrategy)
             *
             * Use this to specify a different naming convention for this entity only.
             * If not specified, uses the global namingStrategy or 'camelCase' as default.
             */
            namingStrategy?: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';
        };
        // Future: Add more user-specific configs
        // features?: UserFeatureFlags;
        // hooks?: UserLifecycleHooks;
    };

    /**
     * Organizations slice configuration
     */
    organizations?: {
        customFields?: OrganizationCustomFieldsConfig<TOrganizationCustomFields>;
        /**
         * Database configuration for organizations table
         */
        database?: {
            /**
             * Database schema name. If not provided, uses default schema.
             * Example: 'public', 'custom_schema'
             */
            schema?: string;
            /**
             * Table name for organizations. Default: 'organizations'
             */
            table?: string;
            /**
             * Naming strategy for custom fields (overrides global namingStrategy)
             *
             * Use this to specify a different naming convention for this entity only.
             * If not specified, uses the global namingStrategy or 'camelCase' as default.
             */
            namingStrategy?: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';
        };
        // Future: Add more organization-specific configs
    };

    /**
     * Organization Memberships slice configuration
     */
    organizationMemberships?: {
        customFields?: OrganizationMembershipCustomFieldsConfig<TOrganizationMembershipCustomFields>;
        /**
         * Database configuration for organization_memberships table
         */
        database?: {
            /**
             * Database schema name. If not provided, uses default schema.
             * Example: 'public', 'custom_schema'
             */
            schema?: string;
            /**
             * Table name for organization memberships. Default: 'organization_memberships'
             */
            table?: string;
            /**
             * Naming strategy for custom fields (overrides global namingStrategy)
             *
             * Use this to specify a different naming convention for this entity only.
             * If not specified, uses the global namingStrategy or 'camelCase' as default.
             */
            namingStrategy?: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';
        };
        // Future: Add more membership-specific configs
    };

    // Future slices: projects, workflows, etc.
    // projects?: {
    //     customFields?: ProjectCustomFieldsConfig<any>;
    // };

    /**
     * Response transformers per handler
     * Allows modifying HTTP responses before returning them to the client
     *
     * Use cases:
     * - Remove sensitive fields (e.g., internal IDs, system metadata)
     * - Add computed fields (e.g., full name from firstName + lastName)
     * - Change response format (e.g., flatten nested structures)
     * - Transform field names (e.g., camelCase to snake_case)
     * - Add custom metadata (e.g., timestamps, version info)
     *
     * Transformers have access to:
     * - Original request (input, principal, requestId)
     * - Built response (status, body, headers)
     * - Use case result (success value or error)
     *
     * Error handling:
     * - If a transformer throws, the original response is returned (fail-safe)
     * - Errors are logged for debugging
     *
     * @example
     * ```typescript
     * const config: ToolkitOptions = {
     *     responseTransformers: {
     *         users: {
     *             GetUser: async ({ response }) => {
     *                 // Remove internal fields
     *                 const { internalId, ...data } = response.body.data;
     *                 return {
     *                     ...response,
     *                     body: { ...response.body, data }
     *                 };
     *             }
     *         },
     *         organizations: {
     *             GetOrganization: async ({ response, useCaseResult }) => {
     *                 // Add computed field
     *                 const org = response.body.data;
     *                 return {
     *                     ...response,
     *                     body: {
     *                         ...response.body,
     *                         data: {
     *                             ...org,
     *                             displayName: org.name || 'Unnamed Organization'
     *                         }
     *                     }
     *                 };
     *             }
     *         }
     *     }
     * };
     * ```
     *
     * TODO: Add support for error response transformation
     */
    responseTransformers?: HandlerResponseTransformers<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;

    /**
     * Use case lifecycle hooks configuration
     *
     * Allows executing custom logic at specific points during use case execution:
     * - onStart: Before input validation
     * - afterValidation: After successful input validation
     * - afterExecution: After successful business logic execution
     * - onError: When an error occurs
     * - onFinally: Always executes at the end
     *
     * All hooks are optional and type-safe per use case.
     *
     * Common use cases:
     * - Logging and monitoring
     * - Metrics collection
     * - Rate limiting
     * - Custom validations
     * - Side effects (emails, notifications)
     *
     * @example
     * ```typescript
     * const config: ToolkitOptions = {
     *     useCaseHooks: {
     *         CreateUser: {
     *             onStart: ({ input, hookContext }) => {
     *                 hookContext.shared.startTime = Date.now();
     *                 console.log('Creating user:', input.externalId);
     *             },
     *             onFinally: ({ result, hookContext }) => {
     *                 const duration = Date.now() - hookContext.shared.startTime;
     *                 metrics.record({ useCase: 'CreateUser', duration });
     *             }
     *         },
     *         GetOrganization: {
     *             afterValidation: async ({ validatedInput }) => {
     *                 // Custom rate limiting
     *                 const attempts = await rateLimiter.check(validatedInput.organizationId);
     *                 if (attempts > 100) {
     *                     throw new RateLimitError('Too many requests');
     *                 }
     *             }
     *         }
     *     }
     * };
     * ```
     */
    useCaseHooks?: UseCaseHooksConfig;
}
