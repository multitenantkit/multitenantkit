import type { PaginatedResponse } from '@multitenantkit/api-contracts/shared';
import {
    type ListUserOrganizationsRequest,
    ListUserOrganizationsRequestSchema
} from '@multitenantkit/api-contracts/users';
import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import { OrganizationSchema } from '@multitenantkit/domain-contracts';
import { type IDomainError, ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { z } from 'zod';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * List user organizations response type - using Organization type directly
 * Generic over TOrganizationCustomFields to support dynamic organization custom fields
 */

// biome-ignore lint/complexity/noBannedTypes: ignore
type OrganizationWithCustomFields<TOrganizationCustomFields = {}> = z.infer<
    typeof OrganizationSchema
> &
    TOrganizationCustomFields;

/**
 * Route definition for list user organizations endpoint
 */
export const listUserOrganizationsRoute: RouteDefinition = {
    method: 'GET',
    path: '/users/me/organizations',
    auth: 'required' // Authentication required to view user organizations
};

/**
 * List user organizations handler factory
 * Returns a configured handler that uses the injected use cases
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - Application use cases
 * @param toolkitOptions - Optional toolkit options (for future organization custom fields)
 */
export function makeListUserOrganizationsHandler<
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
    ListUserOrganizationsRequest,
    PaginatedResponse<OrganizationWithCustomFields<TOrganizationCustomFields>> | HttpErrorResponse
> {
    // Build response schema with custom organization fields if provided
    const customOrganizationFieldsSchema =
        toolkitOptions?.organizations?.customFields?.customSchema;
    const itemSchema = customOrganizationFieldsSchema
        ? OrganizationSchema.merge(customOrganizationFieldsSchema as any)
        : OrganizationSchema;
    const _responseSchema = z.object({
        organizations: z.array(itemSchema as any)
    });
    return async ({
        input,
        principal,
        requestId
    }): Promise<{
        status: number;
        body:
            | PaginatedResponse<OrganizationWithCustomFields<TOrganizationCustomFields>>
            | HttpErrorResponse;
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

            // Build operation context
            const operationContext = buildOperationContext(
                requestId,
                principal,
                'LIST_USER_ORGANIZATIONS'
            );

            // Execute the use case
            const result = await useCases.users.listUserOrganizations.execute(
                {
                    principalExternalId: principal.authProviderId
                },
                operationContext
            );

            // Handle the result
            if (result.isSuccess) {
                const organizations = result.getValue();

                // Validate organizations array with custom fields schema
                const validationResult = await validateWithSchema(
                    z.array(itemSchema as any),
                    organizations,
                    {
                        requestId,
                        field: 'organizations',
                        message: 'Invalid organizations data'
                    }
                );

                if (!validationResult.success) {
                    return validationResult.httpErrorResponse;
                }

                const items = validationResult.data;

                // Build base response with paginated format
                const baseResponse = {
                    status: 200, // OK
                    body: ResponseBuilder.paginated(items, requestId, {
                        total: items.length,
                        page: 1,
                        perPage: items.length
                    }),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer =
                    toolkitOptions?.responseTransformers?.users?.ListUserOrganizations;
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
 * Complete handler package for list user organizations
 * This is what gets consumed by the route builder
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - Application use cases
 * @param toolkitOptions - Optional toolkit options (for future organization custom fields)
 */
export function listUserOrganizationsHandlerPackage<
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
    ListUserOrganizationsRequest,
    PaginatedResponse<OrganizationWithCustomFields<TOrganizationCustomFields>> | HttpErrorResponse
> {
    return {
        route: listUserOrganizationsRoute,
        schema: ListUserOrganizationsRequestSchema,
        handler: makeListUserOrganizationsHandler<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(useCases, toolkitOptions)
    };
}
