import {
    type UpdateOrganizationRequest,
    UpdateOrganizationRequestSchema
} from '@multitenantkit/api-contracts/organizations';
import type { ApiResponse } from '@multitenantkit/api-contracts/shared';
import type { Organization, ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import { OrganizationSchema } from '@multitenantkit/domain-contracts';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { z } from 'zod';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 */
export const updateOrganizationRoute: RouteDefinition = {
    method: 'PATCH',
    path: '/organizations/:id',
    auth: 'required' // Authentication required to update organization
};

/**
 * Update organization name handler factory
 * Returns a configured handler that uses the injected use cases
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - Application use cases
 * @param toolkitOptions - Optional toolkit options for custom schemas
 */
export function makeUpdateOrganizationHandler<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    useCases: UseCases,
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): Handler<
    UpdateOrganizationRequest,
    ApiResponse<Organization & TOrganizationCustomFields> | HttpErrorResponse
> {
    // Build response schema with custom fields if provided
    const customOrganizationFieldsSchema =
        toolkitOptions?.organizations?.customFields?.customSchema;
    const responseSchema = customOrganizationFieldsSchema
        ? OrganizationSchema.merge(customOrganizationFieldsSchema as any)
        : OrganizationSchema;

    // Build body schema for runtime parsing with custom fields (partial)
    const customBodySchema = customOrganizationFieldsSchema
        ? (UpdateOrganizationRequestSchema.shape.body as any)
              .partial()
              .merge((customOrganizationFieldsSchema as any).partial())
        : null;

    return async ({
        input,
        principal,
        requestId
    }): Promise<{
        status: number;
        body: ApiResponse<Organization & TOrganizationCustomFields> | HttpErrorResponse;
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
                'UPDATE_ORGANIZATION',
                input.params.id
            );

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
            const result = await useCases.organizations.updateOrganization.execute(
                {
                    organizationId: input.params.id,
                    principalExternalId: principal.authProviderId,
                    ...(bodyData as any)
                },
                operationContext
            );

            // Handle the result
            if (result.isSuccess) {
                const organization = result.getValue();

                // Validate response with extended schema (includes custom fields if configured)
                const responseValidation = await validateWithSchema(responseSchema, organization, {
                    requestId,
                    field: 'response',
                    message: 'Invalid response data'
                });

                if (!responseValidation.success) {
                    return responseValidation.httpErrorResponse;
                }

                const data = responseValidation.data as Organization & TOrganizationCustomFields;

                // Build base response with standard API format
                const baseResponse = {
                    status: 200, // OK
                    body: ResponseBuilder.success(data, requestId),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer =
                    toolkitOptions?.responseTransformers?.organizations?.UpdateOrganization;
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
 * Complete handler package for update organization name
 * This is what gets consumed by the route builder
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - Application use cases
 * @param toolkitOptions - Optional toolkit options for custom schemas
 */
export function updateOrganizationHandlerPackage<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    useCases: UseCases,
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): HandlerPackage<
    UpdateOrganizationRequest,
    ApiResponse<Organization & TOrganizationCustomFields> | HttpErrorResponse
> {
    // Build request schema with custom fields if provided (params + partial body)
    const customOrganizationFieldsSchema =
        toolkitOptions?.organizations?.customFields?.customSchema;
    let requestSchema: any = UpdateOrganizationRequestSchema;

    if (customOrganizationFieldsSchema) {
        const baseBodySchema = UpdateOrganizationRequestSchema.shape.body.partial();
        const extendedBodySchema = baseBodySchema
            .merge((customOrganizationFieldsSchema as any).partial())
            .refine((data: any) => Object.keys(data).length > 0, {
                message: 'At least one field must be provided for update',
                path: ['root']
            });

        requestSchema = z.object({
            params: UpdateOrganizationRequestSchema.shape.params,
            body: extendedBodySchema
        });
    }

    return {
        route: updateOrganizationRoute,
        schema: requestSchema,
        handler: makeUpdateOrganizationHandler(useCases, toolkitOptions)
    };
}
