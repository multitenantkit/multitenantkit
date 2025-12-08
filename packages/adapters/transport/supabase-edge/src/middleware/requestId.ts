// Request ID middleware for Supabase Edge Functions

/**
 * Generate or extract request ID from headers
 * Uses the Web Crypto API (available in Deno) to generate UUIDs
 */
export function getRequestId(request: Request): string {
    const existingId = request.headers.get('x-request-id');

    if (existingId) {
        return existingId;
    }

    // Generate new UUID using Web Crypto API (available in Deno)
    return crypto.randomUUID();
}
