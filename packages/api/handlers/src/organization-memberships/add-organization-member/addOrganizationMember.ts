import {
    type AddOrganizationMemberRequest,
    AddOrganizationMemberRequestSchema,
    type AddOrganizationMemberResponse
} from '@multitenantkit/api-contracts/organization-memberships';
import type { ApiResponse } from '@multitenantkit/api-contracts/shared';
import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Route definition for add organization member endpoint
 */
export const addOrganizationMemberRoute: RouteDefinition = {
    method: 'POST',
    path: '/organizations/:organizationId/members',
    auth: 'required'
};

/**
 * Add organization member handler factory
 */
export function makeAddOrganizationMemberHandler(
    useCases: UseCases,
    toolkitOptions?: ToolkitOptions
): Handler<
    AddOrganizationMemberRequest,
    ApiResponse<AddOrganizationMemberResponse> | HttpErrorResponse
> {
    return async ({
        input,
        principal,
        requestId
    }): Promise<{
        status: number;
        body: ApiResponse<AddOrganizationMemberResponse> | HttpErrorResponse;
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
                'ADD_ORGANIZATION_MEMBER',
                input.params.organizationId
            );

            // Execute the use case
            const result = await useCases.memberships.addOrganizationMember.execute(
                {
                    principalExternalId: principal.authProviderId,
                    organizationId: input.params.organizationId,
                    username: input.body.username,
                    roleCode: input.body.roleCode
                },
                operationContext
            );
            // Handle successful result
            if (result.isSuccess) {
                const data = result.getValue();

                // Build base response with standard API format
                const baseResponse = {
                    status: 201, // Created
                    body: ResponseBuilder.success(data, requestId),
                    headers: {
                        Location: `/organizations/${data.organizationId}/members/${data.userId}`,
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer =
                    toolkitOptions?.responseTransformers?.organizationMemberships
                        ?.AddOrganizationMember;
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
 * Complete handler package for add organization member
 */
export function addOrganizationMemberHandlerPackage(
    useCases: UseCases,
    toolkitOptions?: ToolkitOptions
): HandlerPackage<
    AddOrganizationMemberRequest,
    ApiResponse<AddOrganizationMemberResponse> | HttpErrorResponse
> {
    return {
        route: addOrganizationMemberRoute,
        schema: AddOrganizationMemberRequestSchema,
        handler: makeAddOrganizationMemberHandler(useCases, toolkitOptions)
    };
}
