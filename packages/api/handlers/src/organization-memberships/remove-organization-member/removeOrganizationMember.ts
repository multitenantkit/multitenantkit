import {
    type RemoveOrganizationMemberRequest,
    RemoveOrganizationMemberRequestSchema
} from '@multitenantkit/api-contracts/organization-memberships';
import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Route definition for remove organization member endpoint
 */
export const removeOrganizationMemberRoute: RouteDefinition = {
    method: 'DELETE',
    path: '/organizations/:organizationId/members/:userId',
    auth: 'required'
};

/**
 * Remove organization member handler factory
 */
export function makeRemoveOrganizationMemberHandler(
    useCases: UseCases,
    toolkitOptions?: ToolkitOptions
): Handler<RemoveOrganizationMemberRequest, undefined | HttpErrorResponse> {
    return async ({
        input,
        principal,
        requestId
    }): Promise<{
        status: number;
        body: undefined | HttpErrorResponse;
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
                'REMOVE_ORGANIZATION_MEMBER',
                input.params.organizationId
            );

            // Execute the use case
            const result = await useCases.memberships.removeOrganizationMember.execute(
                {
                    principalExternalId: principal.authProviderId,
                    organizationId: input.params.organizationId,
                    targetUser: input.params.userId,
                    removeByUsername: input.query?.username !== undefined
                },
                operationContext
            );

            // Handle successful result
            if (result.isSuccess) {
                // Build base response for successful delete operation
                const baseResponse = {
                    status: 204, // No Content
                    body: undefined, // No body for 204
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer =
                    toolkitOptions?.responseTransformers?.organizationMemberships
                        ?.RemoveOrganizationMember;
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
 * Complete handler package for remove organization member
 */
export function removeOrganizationMemberHandlerPackage(
    useCases: UseCases,
    toolkitOptions?: ToolkitOptions
): HandlerPackage<RemoveOrganizationMemberRequest, undefined | HttpErrorResponse> {
    return {
        route: removeOrganizationMemberRoute,
        schema: RemoveOrganizationMemberRequestSchema,
        handler: makeRemoveOrganizationMemberHandler(useCases, toolkitOptions)
    };
}
