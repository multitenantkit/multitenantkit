import type { PaginatedResponse } from '@multitenantkit/api-contracts';
import {
    type ListOrganizationMembersRequest,
    ListOrganizationMembersRequestSchema
} from '@multitenantkit/api-contracts/organizations';
import type { FrameworkConfig, UseCases } from '@multitenantkit/domain-contracts';
import { OrganizationMembershipSchema } from '@multitenantkit/domain-contracts/organization-memberships';
import { OrganizationSchema } from '@multitenantkit/domain-contracts/organizations';
import { type IDomainError, ValidationError } from '@multitenantkit/domain-contracts/shared/errors';
import { UserSchema } from '@multitenantkit/domain-contracts/users';
import { z } from 'zod';
import { ErrorMapper, type HttpErrorResponse } from '../../errors/ErrorMapper';
import type { Handler, HandlerPackage, RouteDefinition } from '../../types';
import { buildOperationContext } from '../../utils/auditContext';
import { ResponseBuilder } from '../../utils/responseBuilder';
import { validateWithSchema } from '../../utils/schemaValidator';
import { applyResponseTransformer } from '../../utils/transformResponse';

/**
 * Helper to merge base Zod object with optional custom-fields Zod object.
 * If custom schema is provided, it merges with base schema (custom fields win on conflicts).
 * If custom schema is wrapped in ZodEffects, unwraps it first.
 */
const mergeCF = <S extends z.AnyZodObject>(base: S, cf?: z.AnyZodObject): z.AnyZodObject => {
    if (!cf) return base;

    // Unwrap ZodEffects if present
    const unwrapped = (cf as any)._def?.schema ?? cf;

    return base.merge(unwrapped) as z.AnyZodObject;
};

/**
 * Route definition for list organization members endpoint
 */
export const listOrganizationMembersRoute: RouteDefinition = {
    method: 'GET',
    path: '/organizations/:organizationId/members',
    auth: 'required' // Authentication required to view organization members
};

/**
 * List organization members handler factory
 * Returns a configured handler that uses the injected use cases
 *
 * Generic support:
 * @template UCF - Zod schema for User custom fields (default: empty object schema)
 * @template TCF - Zod schema for Organization custom fields (default: empty object schema)
 * @template MCF - Zod schema for OrganizationMembership custom fields (default: empty object schema)
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration for custom fields
 */
export function makeListOrganizationMembersHandler<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    UCF extends z.AnyZodObject = z.ZodObject<{}>,
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TCF extends z.AnyZodObject = z.ZodObject<{}>,
    // biome-ignore lint/complexity/noBannedTypes: ignore
    MCF extends z.AnyZodObject = z.ZodObject<{}>
>(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig<z.infer<UCF>, z.infer<TCF>, z.infer<MCF>>
): Handler<ListOrganizationMembersRequest, PaginatedResponse<any> | HttpErrorResponse> {
    // Build response schema inline with custom fields
    // 1) Read optional custom-field schemas from frameworkConfig
    const userCF = frameworkConfig?.users?.customFields?.customSchema as UCF | undefined;
    const organizationCF = frameworkConfig?.organizations?.customFields?.customSchema as
        | TCF
        | undefined;
    const membershipCF = frameworkConfig?.organizationMemberships?.customFields?.customSchema as
        | MCF
        | undefined;

    // 2) Merge base + custom schemas (custom wins on conflicting keys)
    const UserWithCF = mergeCF(UserSchema, userCF);
    const OrganizationWithCF = mergeCF(OrganizationSchema, organizationCF);
    const MembershipWithCF = mergeCF(OrganizationMembershipSchema, membershipCF);

    // 3) Build the final member schema including nested user/organization with their customs
    const MemberWithAll = MembershipWithCF.extend({
        user: UserWithCF.nullable(),
        organization: OrganizationWithCF
    });

    // 4) Response schema is an object with members array
    const ResponseItemSchema = MemberWithAll;
    type ResponseItemType = z.infer<typeof ResponseItemSchema>;

    return async ({
        input,
        principal,
        requestId
    }): Promise<{
        status: number;
        body: PaginatedResponse<ResponseItemType> | HttpErrorResponse;
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
                'LIST_ORGANIZATION_MEMBERS',
                input.params.organizationId
            );

            // Build options from query params
            const options = {
                includeActive: input.query?.includeActive,
                includePending: input.query?.includePending,
                includeRemoved: input.query?.includeRemoved,
                page: input.query?.page || 1,
                pageSize: input.query?.pageSize || 20
            };

            // Execute the use case
            const result = await useCases.organizations.listOrganizationMembers.execute(
                {
                    organizationId: input.params.organizationId,
                    principalExternalId: principal.authProviderId,
                    options
                },
                operationContext
            );

            // Handle the result
            if (result.isSuccess) {
                const paginatedResult = result.getValue();

                // Validate response items array with custom fields schema
                const validationResult = await validateWithSchema(
                    z.array(ResponseItemSchema),
                    paginatedResult.items,
                    {
                        requestId,
                        field: 'members',
                        message: 'Invalid members data'
                    }
                );

                if (!validationResult.success) {
                    return validationResult.httpErrorResponse;
                }

                const membersData: ResponseItemType[] = validationResult.data;

                // Build base response with standard paginated API format
                const baseResponse = {
                    status: 200, // OK
                    body: ResponseBuilder.paginated(membersData, requestId, {
                        total: paginatedResult.pagination.total,
                        page: paginatedResult.pagination.page,
                        perPage: paginatedResult.pagination.pageSize
                    }),
                    headers: {
                        'X-Request-ID': requestId
                    }
                };

                // Apply response transformer if configured
                const transformer =
                    frameworkConfig?.responseTransformers?.organizations?.ListOrganizationMembers;
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
 * Complete handler package for list organization members
 * This is what gets consumed by the route builder
 *
 * Generic support:
 * @template UCF - Zod schema for User custom fields (default: empty object schema)
 * @template TCF - Zod schema for Organization custom fields (default: empty object schema)
 * @template MCF - Zod schema for OrganizationMembership custom fields (default: empty object schema)
 *
 * @param useCases - Application use cases
 * @param frameworkConfig - Optional framework configuration for custom fields
 */
export function listOrganizationMembersHandlerPackage<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    UCF extends z.AnyZodObject = z.ZodObject<{}>,
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TCF extends z.AnyZodObject = z.ZodObject<{}>,
    // biome-ignore lint/complexity/noBannedTypes: ignore
    MCF extends z.AnyZodObject = z.ZodObject<{}>
>(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig<z.infer<UCF>, z.infer<TCF>, z.infer<MCF>>
): HandlerPackage<ListOrganizationMembersRequest, PaginatedResponse<any> | HttpErrorResponse> {
    return {
        route: listOrganizationMembersRoute,
        schema: ListOrganizationMembersRequestSchema,
        handler: makeListOrganizationMembersHandler<UCF, TCF, MCF>(useCases, frameworkConfig as any)
    };
}
