import type { ApiResponse, PaginatedResponse } from '@multitenantkit/api-contracts';

/**
 * Response Builder - Utility for constructing consistent API responses
 *
 * IMPORTANT: This builder is AGNOSTIC to custom fields.
 * Custom fields should be merged into data BEFORE calling these methods.
 *
 * Architecture:
 * 1. Handler merges custom fields into entity schema (if configured)
 * 2. Handler parses entity with merged schema
 * 3. Handler calls ResponseBuilder.success() with parsed data
 * 4. ResponseBuilder wraps data with {data, meta} structure
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class ResponseBuilder {
    /**
     * Build a successful API response
     *
     * @template T - Type of data (can include custom fields)
     * @param data - The data to return (already includes custom fields if configured)
     * @param requestId - Request ID for tracing
     * @returns Wrapped response with meta
     *
     * @example
     * ```typescript
     * // In handler with custom fields:
     * const userSchema = toolkitOptions?.users?.customFields?.customSchema
     *   ? UserSchema.merge(toolkitOptions.users.customFields.customSchema)
     *   : UserSchema;
     *
     * const userData = userSchema.parse(user);  // Includes custom fields
     *
     * return {
     *   status: 200,
     *   body: ResponseBuilder.success(userData, requestId)  // Wraps with {data, meta}
     * };
     * ```
     */
    static success<T>(data: T, requestId: string): ApiResponse<T> {
        return {
            data,
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
                version: '1.0'
            }
        };
    }

    /**
     * Build a paginated API response
     *
     * @template T - Type of items (can include custom fields)
     * @param items - Array of items (already include custom fields if configured)
     * @param requestId - Request ID for tracing
     * @param pagination - Pagination metadata
     * @returns Wrapped response with pagination meta
     *
     * @example
     * ```typescript
     * // In handler with custom fields on nested objects:
     * const membershipSchema = OrganizationMembershipSchema.extend({
     *   user: UserSchema.merge(customUserSchema || z.object({})),
     *   organization: OrganizationSchema.merge(customOrganizationSchema || z.object({}))
     * });
     *
     * const membersData = z.array(membershipSchema).parse(members);
     *
     * return {
     *   status: 200,
     *   body: ResponseBuilder.paginated(membersData, requestId, {
     *     total: 100,
     *     page: 1,
     *     perPage: 20
     *   })
     * };
     * ```
     */
    static paginated<T>(
        items: T[],
        requestId: string,
        pagination: {
            total: number;
            page: number;
            perPage: number;
        }
    ): PaginatedResponse<T> {
        const totalPages = Math.ceil(pagination.total / pagination.perPage);

        return {
            data: items,
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
                version: '1.0',
                pagination: {
                    total: pagination.total,
                    page: pagination.page,
                    perPage: pagination.perPage,
                    totalPages,
                    hasMore: pagination.page < totalPages
                }
            }
        };
    }
}
