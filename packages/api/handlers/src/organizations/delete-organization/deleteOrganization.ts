import {
    type DeleteOrganizationRequest,
    DeleteOrganizationRequestSchema
} from '@multitenantkit/api-contracts/organizations';
import type { ApiResponse } from '@multitenantkit/api-contracts/shared';
import type { FrameworkConfig, Organization, UseCases } from '@multitenantkit/domain-contracts';
import { OrganizationSchema, ValidationError } from '@multitenantkit/domain-contracts';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Route definition for delete organization endpoint
 */
export const deleteOrganizationRoute: RouteDefinition = {
    method: 'DELETE',
    path: '/organizations/:organizationId',
    auth: 'required' // Authentication required for deletion
};

/**
 * Delete organization handler factory
 * Returns a configured handler that uses the injected use cases
 * Performs soft delete by setting deletedAt timestamp
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration for custom schemas
 */
export function makeDeleteOrganizationHandler<
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
): Handler<
    DeleteOrganizationRequest,
    ApiResponse<Organization & TOrganizationCustomFields> | HttpErrorResponse
> {
    // Build response schema with custom fields if provided
    const customOrganizationFieldsSchema =
        frameworkConfig?.organizations?.customFields?.customSchema;
    const responseSchema = customOrganizationFieldsSchema
        ? OrganizationSchema.merge(customOrganizationFieldsSchema as any)
        : OrganizationSchema;

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
                'DELETE_ORGANIZATION',
                input.params.organizationId
            );

            // Execute the use case
            const result = await useCases.organizations.deleteOrganization.execute(
                {
                    organizationId: input.params.organizationId,
                    principalExternalId: principal.authProviderId
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
                    status: 200, // OK - soft delete successful
                    body: ResponseBuilder.success(data, requestId),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer =
                    frameworkConfig?.responseTransformers?.organizations?.DeleteOrganization;
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
 * Complete handler package for delete organization
 * This is what gets consumed by the route builder
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration for custom schemas
 */
export function deleteOrganizationHandlerPackage<
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
): HandlerPackage<
    DeleteOrganizationRequest,
    ApiResponse<Organization & TOrganizationCustomFields> | HttpErrorResponse
> {
    return {
        route: deleteOrganizationRoute,
        schema: DeleteOrganizationRequestSchema,
        handler: makeDeleteOrganizationHandler(useCases, frameworkConfig)
    };
}
