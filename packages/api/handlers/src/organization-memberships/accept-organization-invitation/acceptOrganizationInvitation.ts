import {
    type AcceptOrganizationInvitationRequest,
    AcceptOrganizationInvitationRequestSchema
} from '@multitenantkit/api-contracts/organization-memberships';
import type { ApiResponse } from '@multitenantkit/api-contracts/shared';
import type {
    OrganizationMembership,
    ToolkitOptions,
    UseCases
} from '@multitenantkit/domain-contracts';
import { OrganizationMembershipSchema } from '@multitenantkit/domain-contracts';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';

/**
 * Route definition for accept organization invitation endpoint
 */
export const acceptOrganizationInvitationRoute: RouteDefinition = {
    method: 'POST',
    path: '/organizations/:organizationId/accept',
    auth: 'required' // Must be authenticated to accept invitation
};

/**
 * Accept organization invitation handler factory
 * Allows a registered user to accept a pending invitation
 */
export function makeAcceptOrganizationInvitationHandler<
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
    AcceptOrganizationInvitationRequest,
    ApiResponse<OrganizationMembership & TOrganizationMembershipCustomFields> | HttpErrorResponse
> {
    // Build response schema with custom fields if provided
    const customMembershipFieldsSchema =
        toolkitOptions?.organizationMemberships?.customFields?.customSchema;
    const responseSchema = customMembershipFieldsSchema
        ? OrganizationMembershipSchema.merge(customMembershipFieldsSchema as any)
        : OrganizationMembershipSchema;

    return async ({ input, principal, requestId }) => {
        try {
            // Require authentication
            if (!principal) {
                const { status, body } = ErrorMapper.toHttpError(
                    new ValidationError(
                        'Authentication is required to accept invitations',
                        'principal'
                    ),
                    requestId
                );
                return { status, body, headers: { 'X-Request-ID': requestId } };
            }

            // Validate params
            const paramsValidation = await validateWithSchema(
                AcceptOrganizationInvitationRequestSchema.shape.params,
                input.params,
                {
                    requestId,
                    field: 'params',
                    message: 'Invalid request params'
                }
            );

            if (!paramsValidation.success) {
                return paramsValidation.httpErrorResponse;
            }

            // Validate body
            const bodyValidation = await validateWithSchema(
                AcceptOrganizationInvitationRequestSchema.shape.body,
                input.body,
                {
                    requestId,
                    field: 'body',
                    message: 'Invalid request body'
                }
            );

            if (!bodyValidation.success) {
                return bodyValidation.httpErrorResponse;
            }

            const { organizationId } = paramsValidation.data;
            const { username } = bodyValidation.data;

            // Build operation context
            const operationContext = buildOperationContext(
                requestId,
                principal,
                'ACCEPT_ORGANIZATION_INVITATION',
                organizationId
            );

            // Execute use case
            const result = await useCases.memberships.acceptOrganizationInvitation.execute(
                {
                    principalExternalId: principal.authProviderId,
                    organizationId,
                    username
                },
                operationContext
            );

            // Handle result
            if (result.isSuccess) {
                const membership = result.getValue();

                // Validate response
                const responseValidation = await validateWithSchema(responseSchema, membership, {
                    requestId,
                    field: 'response',
                    message: 'Invalid response data'
                });

                if (!responseValidation.success) {
                    return responseValidation.httpErrorResponse;
                }

                const data = responseValidation.data as OrganizationMembership &
                    TOrganizationMembershipCustomFields;

                return {
                    status: 200, // OK
                    body: ResponseBuilder.success(data, requestId),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };
            } else {
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
 * Complete handler package for accept organization invitation
 */
export function acceptOrganizationInvitationHandlerPackage<
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
    AcceptOrganizationInvitationRequest,
    ApiResponse<OrganizationMembership & TOrganizationMembershipCustomFields> | HttpErrorResponse
> {
    return {
        route: acceptOrganizationInvitationRoute,
        schema: AcceptOrganizationInvitationRequestSchema,
        handler: makeAcceptOrganizationInvitationHandler(useCases, toolkitOptions)
    };
}
