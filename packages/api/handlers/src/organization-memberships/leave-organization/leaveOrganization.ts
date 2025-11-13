import { Handler, RouteDefinition, HandlerPackage } from '../../types';
import { ErrorMapper, HttpErrorResponse } from '../../errors/ErrorMapper';
import {
    LeaveOrganizationRequest,
    LeaveOrganizationResponse,
    LeaveOrganizationRequestSchema,
    LeaveOrganizationResponseSchema
} from '@multitenantkit/api-contracts/organization-memberships';
import { ApiResponse } from '@multitenantkit/api-contracts/shared';
import type { UseCases, FrameworkConfig } from '@multitenantkit/domain-contracts';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Route definition for leave organization endpoint
 */
export const leaveOrganizationRoute: RouteDefinition = {
    method: 'DELETE',
    path: '/organizations/:organizationId/members/me',
    auth: 'required'
};

/**
 * Leave organization handler factory
 */
export function makeLeaveOrganizationHandler(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig
): Handler<LeaveOrganizationRequest, ApiResponse<LeaveOrganizationResponse> | HttpErrorResponse> {
    return async ({
        input,
        principal,
        requestId
    }): Promise<{
        status: number;
        body: ApiResponse<LeaveOrganizationResponse> | HttpErrorResponse;
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
                'LEAVE_ORGANIZATION',
                input.params.organizationId
            );

            // Execute the use case
            const result = await useCases.memberships.leaveOrganization.execute(
                {
                    organizationId: input.params.organizationId,
                    principalExternalId: principal.authProviderId
                },
                operationContext
            );

            // Handle successful result
            if (result.isSuccess) {
                const data = result.getValue();

                // Build base response with standard API format
                const baseResponse = {
                    status: 200, // OK
                    body: ResponseBuilder.success(data, requestId),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer = frameworkConfig?.responseTransformers?.organizationMemberships?.LeaveOrganization;
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
 * Complete handler package for leave organization
 */
export function leaveOrganizationHandlerPackage(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig
): HandlerPackage<
    LeaveOrganizationRequest,
    ApiResponse<LeaveOrganizationResponse> | HttpErrorResponse
> {
    return {
        route: leaveOrganizationRoute,
        schema: LeaveOrganizationRequestSchema,
        handler: makeLeaveOrganizationHandler(useCases, frameworkConfig)
    };
}
