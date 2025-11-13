import { z } from 'zod';

/**
 * Generic pagination options for list queries
 */
export interface PaginationOptions {
    /** Page number (1-indexed) */
    page?: number;
    /** Number of items per page */
    pageSize?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
    /** Total count of items matching the filters (across all pages) */
    total: number;
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of pages */
    totalPages: number;
}

/**
 * Paginated result with metadata
 * Generic container for any paginated data (flat structure for repositories)
 * 
 * @template T - The type of items in the result set
 */
export interface PaginatedResult<T> {
    /** Array of items for the current page */
    items: T[];
    /** Total count of items matching the filters (across all pages) */
    total: number;
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of pages */
    totalPages: number;
}

/**
 * Zod schema for pagination metadata
 */
export const PaginationMetadataSchema = z.object({
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalPages: z.number().int().min(0)
});

/**
 * Factory function to create a paginated result schema for any item type
 * 
 * @param itemSchema - Zod schema for the items
 * @returns Zod schema for paginated result with the given item type
 * 
 * @example
 * const UserPaginatedSchema = createPaginatedResultSchema(UserSchema);
 */
export function createPaginatedResultSchema<T extends z.ZodTypeAny>(itemSchema: T) {
    return z.object({
        items: z.array(itemSchema),
        pagination: PaginationMetadataSchema
    });
}
