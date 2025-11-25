import {
    type CreateOrganizationRequest,
    CreateOrganizationRequestSchema
} from '@multitenantkit/api-contracts/organizations';
import type { ApiResponse } from '@multitenantkit/api-contracts/shared';
import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import { type Organization, OrganizationSchema } from '@multitenantkit/domain-contracts';
import { type DomainError, ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { z } from 'zod';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Route definition for create organization endpoint
 */
export const createOrganizationRoute: RouteDefinition = {
    method: 'POST',
    path: '/organizations',
    auth: 'required' // Authentication required for organization creation
};

/**
 * Create organization handler factory
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
export function makeCreateOrganizationHandler<
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
    CreateOrganizationRequest,
    ApiResponse<Organization & TOrganizationCustomFields> | HttpErrorResponse
> {
    // Build response schema with custom fields if provided
    const customOrganizationFieldsSchema =
        toolkitOptions?.organizations?.customFields?.customSchema;
    const responseSchema = customOrganizationFieldsSchema
        ? OrganizationSchema.merge(customOrganizationFieldsSchema as any)
        : OrganizationSchema;

    // Build body schema for runtime parsing with organization AND membership custom fields
    const customMembershipFieldsSchema =
        toolkitOptions?.organizationMemberships?.customFields?.customSchema;

    let customBodySchema = customOrganizationFieldsSchema
        ? CreateOrganizationRequestSchema.shape.body.merge(customOrganizationFieldsSchema as any)
        : CreateOrganizationRequestSchema.shape.body;

    // Add optional ownerMembershipCustomFields if membership custom schema is configured
    if (customMembershipFieldsSchema) {
        customBodySchema = customBodySchema.extend({
            ownerMembershipCustomFields: (customMembershipFieldsSchema as any).partial().optional()
        });
    }

    const finalBodySchema =
        customBodySchema !== CreateOrganizationRequestSchema.shape.body ? customBodySchema : null;

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
                'CREATE_ORGANIZATION'
            );

            // Validate body with custom fields schema if available
            const bodyValidation = await validateWithSchema(finalBodySchema, input.body, {
                requestId,
                field: 'body',
                message: 'Invalid request body'
            });

            if (!bodyValidation.success) {
                return bodyValidation.httpErrorResponse;
            }

            const bodyData = bodyValidation.data;

            const result = await useCases.organizations.createOrganization.execute(
                {
                    principalExternalId: principal.authProviderId,
                    ...(bodyData as any) // Cast needed because use case doesn't know about custom fields
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
                    status: 201, // Created
                    body: ResponseBuilder.success(data, requestId),
                    headers: {
                        Location: `/organizations/${organization.id}`,
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer =
                    toolkitOptions?.responseTransformers?.organizations?.CreateOrganization;
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
 * Complete handler package for create organization
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
export function createOrganizationHandlerPackage<
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
    CreateOrganizationRequest,
    ApiResponse<Organization & TOrganizationCustomFields> | HttpErrorResponse
> {
    // Build request schema with organization and membership custom fields if provided
    const customOrganizationFieldsSchema =
        toolkitOptions?.organizations?.customFields?.customSchema;
    const customMembershipFieldsSchema =
        toolkitOptions?.organizationMemberships?.customFields?.customSchema;

    let requestSchema: any = CreateOrganizationRequestSchema;

    if (customOrganizationFieldsSchema || customMembershipFieldsSchema) {
        // Extract base body schema from existing schema
        const baseBodySchema = CreateOrganizationRequestSchema.shape.body;

        // Start with base schema
        let extendedBodySchema = baseBodySchema;

        // Merge with organization custom fields if provided
        if (customOrganizationFieldsSchema) {
            extendedBodySchema = extendedBodySchema.merge(customOrganizationFieldsSchema as any);
        }

        // Add optional ownerMembershipCustomFields if membership custom schema is configured
        if (customMembershipFieldsSchema) {
            extendedBodySchema = extendedBodySchema.extend({
                ownerMembershipCustomFields: (customMembershipFieldsSchema as any)
                    .partial()
                    .optional()
            });
        }

        requestSchema = z.object({
            body: extendedBodySchema
        });
    }

    return {
        route: createOrganizationRoute,
        schema: requestSchema,
        handler: makeCreateOrganizationHandler(useCases, toolkitOptions)
    };
}
