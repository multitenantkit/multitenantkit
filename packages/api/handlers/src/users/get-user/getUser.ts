import { Handler, RouteDefinition, HandlerPackage } from '../../types';
import { ErrorMapper, HttpErrorResponse } from '../../errors/ErrorMapper';
import {
    type UseCases,
    type FrameworkConfig,
    UserSchema,
    User
} from '@multitenantkit/domain-contracts';
import { IDomainError, ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';
import type { ApiResponse } from '@multitenantkit/api-contracts';

/**
 * Route definition for get user endpoint
 */
export const getUserRoute: RouteDefinition = {
    method: 'GET',
    path: '/users/me',
    auth: 'required'
};

/**
 * Get user handler factory
 * Returns a configured handler that uses the injected use cases
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration for custom schemas
 */
export function makeGetUserHandler<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
>(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): Handler<Record<string, never>, ApiResponse<User & TUserCustomFields> | HttpErrorResponse> {
    // Build response schema with custom fields if provided
    const customUserFieldsSchema = frameworkConfig?.users?.customFields?.customSchema;
    const responseSchema = customUserFieldsSchema
        ? UserSchema.merge(customUserFieldsSchema as any)
        : UserSchema;
    return async ({
        input,
        principal,
        requestId
    }): Promise<{
        status: number;
        body: ApiResponse<User & TUserCustomFields> | HttpErrorResponse;
        headers?: Record<string, string>;
    }> => {
        try {
            if (!principal) {
                const { status, body } = ErrorMapper.toHttpError(
                    new ValidationError(
                        'Authentication is required for this operation',
                        'principal'
                    ),
                    requestId
                );

                return {
                    status,
                    body,
                    headers: {
                        'X-Request-ID': requestId
                    }
                };
            }
            // Build operation context
            const operationContext = buildOperationContext(requestId, principal, 'GET_USER');

            // Execute the use case
            const result = await useCases.users.getUser.execute(
                {
                    principalExternalId: principal.authProviderId
                },
                operationContext
            );

            // Handle the result
            if (result.isSuccess) {
                const user = result.getValue();

                // Validate response with extended schema (includes custom fields if configured)
                const validationResult = await validateWithSchema(responseSchema, user, {
                    requestId,
                    field: 'response',
                    message: 'Invalid response data'
                });

                if (!validationResult.success) {
                    return validationResult.httpErrorResponse;
                }

                const userData = validationResult.data as User & TUserCustomFields;

                // Build base response with standard API format
                const baseResponse = {
                    status: 200, // OK
                    body: ResponseBuilder.success(userData, requestId),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer = frameworkConfig?.responseTransformers?.users?.GetUser;
                return applyResponseTransformer(
                    {
                        request: { input, principal, requestId },
                        response: baseResponse,
                        useCaseResult: result
                    },
                    transformer
                );
            } else {
                // Map domain error to HTTP error
                const domainError = result.getError() as IDomainError;
                const { status, body } = ErrorMapper.toHttpError(domainError, requestId);

                return {
                    status,
                    body,
                    headers: {
                        'X-Request-ID': requestId
                    }
                };
            }
        } catch (error) {
            // Handle unexpected errors
            const { status, body } = ErrorMapper.fromGenericError(error as Error, requestId);

            return {
                status,
                body,
                headers: {
                    'X-Request-ID': requestId
                }
            };
        }
    };
}

/**
 * Complete handler package for get user
 * This is what gets consumed by the route builder
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration for custom schemas
 */
export function getUserHandlerPackage<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
>(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): HandlerPackage<
    Record<string, never>,
    ApiResponse<User & TUserCustomFields> | HttpErrorResponse
> {
    return {
        route: getUserRoute,
        schema: {}, // GET /users/me has no params, query, or body
        handler: makeGetUserHandler(useCases, frameworkConfig)
    };
}
