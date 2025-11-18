import {
    type TransferOrganizationOwnershipRequest,
    TransferOrganizationOwnershipRequestSchema
} from '@multitenantkit/api-contracts/organizations';
import type { ApiResponse } from '@multitenantkit/api-contracts/shared';
import {
    type Organization,
    OrganizationSchema,
    type ToolkitOptions,
    type UseCases
} from '@multitenantkit/domain-contracts';
import { ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Route definition for transfer organization ownership endpoint
 */
export const transferOrganizationOwnershipRoute: RouteDefinition = {
    method: 'POST',
    path: '/organizations/:organizationId/transfer-ownership',
    auth: 'required' // Authentication required for ownership transfer
};

/**
 * Transfer organization ownership handler factory
 * Returns a configured handler that uses the injected use cases
 * Transfers ownership from current owner to a new owner
 *
 * Business rules (enforced by use case):
 * - Only the current owner can transfer ownership
 * - Both users must be active (not soft-deleted)
 * - Organization must be active (not soft-deleted)
 * - Both users must have active memberships
 * - New owner must be different from current owner
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships
 *
 * @param useCases - Application use cases
 * @param toolkitOptions - Optional toolkit options for custom schemas
 */
export function makeTransferOrganizationOwnershipHandler<
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
): Handler<TransferOrganizationOwnershipRequest, ApiResponse<Organization> | HttpErrorResponse> {
    return async ({
        input,
        principal,
        requestId
    }): Promise<{
        status: number;
        body: ApiResponse<Organization> | HttpErrorResponse;
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
                'TRANSFER_ORGANIZATION_OWNERSHIP',
                input.params.organizationId
            );

            // Execute the use case
            const result = await useCases.organizations.transferOrganizationOwnership.execute(
                {
                    organizationId: input.params.organizationId,
                    newOwnerId: input.body.newOwnerId
                },
                operationContext
            );

            // Handle the result
            if (result.isSuccess) {
                const output = result.getValue();

                // Parse with Organization schema (converts Dates to ISO strings)
                const data = OrganizationSchema.parse(output);

                // Build base response with standard API format
                const baseResponse = {
                    status: 200, // OK - transfer successful
                    body: ResponseBuilder.success(data, requestId),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer =
                    toolkitOptions?.responseTransformers?.organizations
                        ?.TransferOrganizationOwnership;
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
 * Complete handler package for transfer organization ownership
 * This is what gets consumed by the route builder
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships
 *
 * @param useCases - Application use cases
 * @param toolkitOptions - Optional toolkit options for custom schemas
 */
export function transferOrganizationOwnershipHandlerPackage<
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
    TransferOrganizationOwnershipRequest,
    ApiResponse<Organization> | HttpErrorResponse
> {
    return {
        route: transferOrganizationOwnershipRoute,
        schema: TransferOrganizationOwnershipRequestSchema,
        handler: makeTransferOrganizationOwnershipHandler(useCases, toolkitOptions)
    };
}
