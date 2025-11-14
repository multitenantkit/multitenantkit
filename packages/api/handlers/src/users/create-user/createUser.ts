import type { ApiResponse } from '@multitenantkit/api-contracts';
import {
    type CreateUserRequest,
    CreateUserRequestSchema
} from '@multitenantkit/api-contracts/users';
import type { FrameworkConfig, UseCases, User } from '@multitenantkit/domain-contracts';
import { UserSchema } from '@multitenantkit/domain-contracts';
import type { DomainError } from '@multitenantkit/domain-contracts/shared/errors';
import { z } from 'zod';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Route definition for create user endpoint
 */
export const createUserRoute: RouteDefinition = {
    method: 'POST',
    path: '/users',
    auth: 'none' // No authentication required for user creation (registration)
};

/**
 * Create user handler factory
 * Returns a configured handler that uses the injected use cases
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration (not used yet, for future extension)
 */
export function makeCreateUserHandler<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): Handler<CreateUserRequest, ApiResponse<User & TUserCustomFields> | HttpErrorResponse> {
    // Build response schema with custom fields if provided
    const customUserFieldsSchema = frameworkConfig?.users?.customFields?.customSchema;
    const responseSchema = customUserFieldsSchema
        ? UserSchema.merge(customUserFieldsSchema as any)
        : UserSchema;

    // Build body schema for runtime parsing with custom fields
    const customBodySchema = customUserFieldsSchema
        ? CreateUserRequestSchema.shape.body.merge(customUserFieldsSchema as any)
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
            // Build operation context for audit logging
            const operationContext = buildOperationContext(requestId, principal, 'CREATE_USER');

            // Validate body with custom fields schema if available
            const bodyValidation = await validateWithSchema(customBodySchema, input.body, {
                requestId,
                field: 'body',
                message: 'Invalid request body'
            });

            if (!bodyValidation.success) {
                return bodyValidation.httpErrorResponse;
            }

            const bodyData = bodyValidation.data;

            const result = await useCases.users.createUser.execute(
                {
                    ...(bodyData as any) // Cast needed because use case doesn't know about custom fields
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
                    status: 201, // Created
                    body: ResponseBuilder.success(userData, requestId),
                    headers: {
                        Location: `/users/${user.id}`,
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer = frameworkConfig?.responseTransformers?.users?.CreateUser;
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
                const domainError = result.getError() as DomainError;
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
 * Complete handler package for create user
 * This is what gets consumed by the route builder
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration (not used yet, for future extension)
 */
export function createUserHandlerPackage<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): HandlerPackage<CreateUserRequest, ApiResponse<User & TUserCustomFields> | HttpErrorResponse> {
    // Build request schema with custom fields if provided
    const customUserFieldsSchema = frameworkConfig?.users?.customFields?.customSchema;
    let requestSchema: any = CreateUserRequestSchema;

    if (customUserFieldsSchema) {
        // Extract base body schema from existing schema
        // CreateUserRequestSchema.shape.body already has the picked fields (email, firstName, lastName)
        const baseBodySchema = CreateUserRequestSchema.shape.body;

        // Merge with custom fields (required for create)
        const extendedBodySchema = baseBodySchema.merge(customUserFieldsSchema as any);

        requestSchema = z.object({
            body: extendedBodySchema
        });
    }

    return {
        route: createUserRoute,
        schema: requestSchema,
        handler: makeCreateUserHandler(useCases, frameworkConfig)
    };
}
