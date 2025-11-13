import { Handler, RouteDefinition, HandlerPackage } from '../../types';
import { ErrorMapper, HttpErrorResponse } from '../../errors/ErrorMapper';
import { ApiResponse } from '@multitenantkit/api-contracts/shared';
import {
    RestoreOrganizationRequest,
    RestoreOrganizationRequestSchema
} from '@multitenantkit/api-contracts/organizations';
import type { UseCases, FrameworkConfig, Organization } from '@multitenantkit/domain-contracts';
import { ValidationError, OrganizationSchema } from '@multitenantkit/domain-contracts';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Route definition for restore organization endpoint
 */
export const restoreOrganizationRoute: RouteDefinition = {
    method: 'POST',
    path: '/organizations/:organizationId/restore',
    auth: 'required' // Authentication required for restoration
};

/**
 * Restore organization handler factory
 * Returns a configured handler that uses the injected use cases
 * Restores a soft-deleted organization by clearing the deletedAt timestamp
 *
 * Business rules enforced by use case:
 * - Only the organization owner can restore the organization
 * - The owner must be an active user (not soft-deleted)
 * - The organization must be currently soft-deleted
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration for custom schemas
 */
export function makeRestoreOrganizationHandler<
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
): Handler<
    RestoreOrganizationRequest,
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
                'RESTORE_ORGANIZATION'
            );

            // Execute the use case
            const result = await useCases.organizations.restoreOrganization.execute(
                {
                    organizationId: input.params.organizationId
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
                    status: 200, // OK - restore successful
                    body: ResponseBuilder.success(data, requestId),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer = frameworkConfig?.responseTransformers?.organizations?.RestoreOrganization;
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
 * Complete handler package for restore organization
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
export function restoreOrganizationHandlerPackage<
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
    RestoreOrganizationRequest,
    ApiResponse<Organization & TOrganizationCustomFields> | HttpErrorResponse
> {
    return {
        route: restoreOrganizationRoute,
        schema: RestoreOrganizationRequestSchema,
        handler: makeRestoreOrganizationHandler(useCases, frameworkConfig)
    };
}
