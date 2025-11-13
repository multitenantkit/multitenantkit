import type { IResult } from '../results/Result';
import type { IDomainError } from '../errors/IDomainError';
import type { Principal } from '../auth/Principal';

/**
 * Context available to response transformers
 * Provides access to the original request, the constructed response, and the use case result
 *
 * @template TInput - Type of the use case input
 * @template TOutput - Type of the use case output (domain entity)
 */
export interface ResponseTransformerContext<TInput, TOutput> {
    /**
     * Original request information
     */
    request: {
        /** Validated input that was passed to the use case */
        input: TInput;
        /** Authenticated principal (user) making the request */
        principal?: Principal;
        /** Unique request identifier for tracing */
        requestId: string;
    };

    /**
     * HTTP response that was built by the handler
     * This is the response that will be returned to the client if not transformed
     */
    response: {
        /** HTTP status code */
        status: number;
        /** Response body (usually ApiResponse<T> format) */
        body: any;
        /** HTTP headers */
        headers?: Record<string, string>;
    };

    /**
     * Original use case execution result
     * Contains either success value or domain error
     */
    useCaseResult: IResult<TOutput, IDomainError>;
}

/**
 * Function type for transforming HTTP responses
 * Allows custom transformation of successful responses before they reach the client
 *
 * Use cases:
 * - Remove sensitive fields (e.g., remove internal IDs)
 * - Add computed fields (e.g., add full name from firstName + lastName)
 * - Change response format (e.g., flatten nested structures)
 * - Add metadata (e.g., add timestamps, version info)
 * - Transform field names (e.g., camelCase to snake_case)
 *
 * @template TInput - Type of the use case input
 * @template TOutput - Type of the use case output (domain entity)
 *
 * @param context - Full context including request, response, and use case result
 * @returns Transformed response object with status, body, and optional headers
 *
 * @example
 * ```typescript
 * const removeInternalId: ResponseTransformer<GetUserInput, User> = async (context) => {
 *     const { response } = context;
 *     const data = response.body.data;
 *     
 *     // Remove internal fields
 *     const { internalId, ...publicData } = data;
 *     
 *     return {
 *         ...response,
 *         body: {
 *             ...response.body,
 *             data: publicData
 *         }
 *     };
 * };
 * ```
 */
export type ResponseTransformer<TInput = any, TOutput = any> = (
    context: ResponseTransformerContext<TInput, TOutput>
) => Promise<{
    status: number;
    body: any;
    headers?: Record<string, string>;
}>;

/**
 * Mapping of handler names to their response transformers
 * Organized by entity type (users, organizations, organizationMemberships)
 *
 * This type is used in FrameworkConfig to provide type-safe transformer configuration.
 */
export interface HandlerResponseTransformers<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
> {
    /**
     * Response transformers for user-related handlers
     */
    users?: {
        /** Transform GetUser response */
        GetUser?: ResponseTransformer<any, any>;
        /** Transform CreateUser response */
        CreateUser?: ResponseTransformer<any, any>;
        /** Transform UpdateUser response */
        UpdateUser?: ResponseTransformer<any, any>;
        /** Transform DeleteUser response */
        DeleteUser?: ResponseTransformer<any, any>;
        /** Transform ListUserOrganizations response */
        ListUserOrganizations?: ResponseTransformer<any, any>;
    };

    /**
     * Response transformers for organization-related handlers
     */
    organizations?: {
        /** Transform GetOrganization response */
        GetOrganization?: ResponseTransformer<any, any>;
        /** Transform CreateOrganization response */
        CreateOrganization?: ResponseTransformer<any, any>;
        /** Transform UpdateOrganization response */
        UpdateOrganization?: ResponseTransformer<any, any>;
        /** Transform DeleteOrganization response */
        DeleteOrganization?: ResponseTransformer<any, any>;
        /** Transform ListOrganizationMembers response */
        ListOrganizationMembers?: ResponseTransformer<any, any>;
        /** Transform ArchiveOrganization response */
        ArchiveOrganization?: ResponseTransformer<any, any>;
        /** Transform RestoreOrganization response */
        RestoreOrganization?: ResponseTransformer<any, any>;
        /** Transform TransferOrganizationOwnership response */
        TransferOrganizationOwnership?: ResponseTransformer<any, any>;
    };

    /**
     * Response transformers for organization membership-related handlers
     */
    organizationMemberships?: {
        /** Transform AddOrganizationMember response */
        AddOrganizationMember?: ResponseTransformer<any, any>;
        /** Transform RemoveOrganizationMember response */
        RemoveOrganizationMember?: ResponseTransformer<any, any>;
        /** Transform UpdateOrganizationMember response */
        UpdateOrganizationMember?: ResponseTransformer<any, any>;
        /** Transform LeaveOrganization response */
        LeaveOrganization?: ResponseTransformer<any, any>;
    };
}
