/**
 * Input type for Supabase authentication
 * Supabase uses JWT tokens in the Authorization header
 */
export interface SupabaseAuthInput {
    /**
     * HTTP headers containing the Authorization header with JWT token
     */
    headers: Record<string, string>;

    /**
     * Optional cookies (for future session-based auth)
     */
    cookies?: Record<string, string>;
}
