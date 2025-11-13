import { Handler, RouteDefinition, HandlerPackage } from '../../types';
import { ErrorMapper, HttpErrorResponse } from '../../errors/ErrorMapper';
import { UpdateUserRequest, UpdateUserRequestSchema } from '@multitenantkit/api-contracts/users';
import type { UseCases, FrameworkConfig, User } from '@multitenantkit/domain-contracts';
import { UserSchema } from '@multitenantkit/domain-contracts';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';
import type { ApiResponse } from '@multitenantkit/api-contracts';
import { z } from 'zod';

/**
 * Route definition for update user profile endpoint
 */
export const updateUserRoute: RouteDefinition = {
    method: 'PATCH',
    path: '/users/me',
    auth: 'required' // Authentication required for profile updates
};

/**
 * Update user profile handler factory
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
export function makeUpdateUserHandler<
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
): Handler<UpdateUserRequest, ApiResponse<User & TUserCustomFields> | HttpErrorResponse> {
    // Build response schema with custom fields if provided
    const customUserFieldsSchema = frameworkConfig?.users?.customFields?.customSchema;
    const responseSchema = customUserFieldsSchema
        ? UserSchema.merge(customUserFieldsSchema as any)
        : UserSchema;

    // Build body schema for runtime parsing with custom fields
    const customBodySchema = customUserFieldsSchema
        ? UpdateUserRequestSchema.shape.body
              .partial()
              .merge((customUserFieldsSchema as any).partial())
        : null;

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
            // Ensure we have a principal (authenticated user)
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

            // Build operation context for audit logging
            const operationContext = buildOperationContext(
                requestId,
                principal,
                'UPDATE_USER_PROFILE'
            );

            // Validate body with custom fields schema if available
            // If no custom schema, validateWithSchema returns the payload as-is
            const validationResult = await validateWithSchema(customBodySchema, input.body, {
                requestId,
                field: 'body',
                message: 'Invalid request body'
            });

            if (!validationResult.success) {
                return validationResult.httpErrorResponse;
            }

            const bodyData = validationResult.data;

            const result = await useCases.users.updateUser.execute(
                {
                    principalExternalId: principal.authProviderId,
                    ...(bodyData as any)
                },
                operationContext
            );

            // Handle the result
            if (result.isSuccess) {
                const user = result.getValue();

                // Validate response with extended schema (includes custom fields if configured)
                const responseValidation = await validateWithSchema(responseSchema, user, {
                    requestId,
                    field: 'response',
                    message: 'Invalid response data'
                });

                if (!responseValidation.success) {
                    return responseValidation.httpErrorResponse;
                }

                const userData = responseValidation.data as User & TUserCustomFields;

                // Build base response with standard API format
                const baseResponse = {
                    status: 200, // OK
                    body: ResponseBuilder.success(userData, requestId),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer = frameworkConfig?.responseTransformers?.users?.UpdateUser;
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
                const domainError = result.getError();
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
 * Complete handler package for update user profile
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
export function updateUserHandlerPackage<
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
): HandlerPackage<UpdateUserRequest, ApiResponse<User & TUserCustomFields> | HttpErrorResponse> {
    // Build request schema with custom fields if provided
    const customUserFieldsSchema = frameworkConfig?.users?.customFields?.customSchema;
    let requestSchema: any = UpdateUserRequestSchema;

    if (customUserFieldsSchema) {
        // Extract base body schema from existing schema and make it partial
        const baseBodySchema = UpdateUserRequestSchema.shape.body.partial();

        // Merge with custom fields (also partial)
        const extendedBodySchema = baseBodySchema
            .merge((customUserFieldsSchema as any).partial())
            .refine(
                (data: any) => {
                    // At least one field must be provided
                    return Object.keys(data).length > 0;
                },
                {
                    message: 'At least one field must be provided for update',
                    path: ['root']
                }
            );

        requestSchema = z.object({
            body: extendedBodySchema
        });
    }

    return {
        route: updateUserRoute,
        schema: requestSchema,
        handler: makeUpdateUserHandler(useCases, frameworkConfig)
    };
}
