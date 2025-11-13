import { z } from "zod";

/**
 * Base Meta Schema for all API responses
 * Contains request tracking and versioning information
 */
export const MetaSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string().datetime(),
  version: z.string().default("1.0"),
});

export type Meta = z.infer<typeof MetaSchema>;

/**
 * Pagination Metadata
 * Extends Meta with pagination-specific fields
 */
export const PaginationMetaSchema = MetaSchema.extend({
  pagination: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    perPage: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  }),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Generic API Response wrapper
 * Wraps any data type with meta information
 *
 * @template T - The type of data being returned
 *
 * IMPORTANT: This is a BASE wrapper. Custom fields should be merged
 * into T BEFORE passing to this wrapper (done in handlers).
 *
 * Example usage in handlers:
 * ```typescript
 * // 1. Merge custom fields into data schema
 * const userWithCF = UserSchema.merge(customUserFieldsSchema);
 * const userData = userWithCF.parse(user);
 *
 * // 2. Wrap with ApiResponse (custom fields already in userData)
 * return ResponseBuilder.success(userData, requestId);
 * ```
 */
export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: MetaSchema,
  });
}

/**
 * Paginated API Response
 * Similar to ApiResponse but for arrays with pagination metadata
 *
 * @template T - The type of items in the array
 *
 * IMPORTANT: Custom fields handling same as ApiResponseSchema.
 * Merge custom fields into T BEFORE using this wrapper.
 */
export function PaginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T
) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

/**
 * Error Response Schema
 * Consistent error format across all endpoints
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    requestId: z.string().uuid(),
    timestamp: z.string().datetime(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Generic types for responses
 */
export type ApiResponse<T> = {
  data: T;
  meta: Meta;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};
