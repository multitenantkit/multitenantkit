import type { Principal } from '@multitenantkit/domain-contracts/shared/auth';

/**
 * Auth Service port - abstracts authentication logic
 *
 * Generic TAuthInput allows each implementation to define its own input type
 * This provides flexibility while maintaining type safety where it matters
 *
 * @template TAuthInput - The input type that the auth service expects
 *                        (headers, claims, cookies, context, etc.)
 *
 * @example
 * // Supabase implementation expects headers
 * class SupabaseAuthService implements AuthService<{ headers: Record<string, string> }> {
 *   async authenticate(input) {
 *     const token = input.headers['authorization'];
 *     // ...
 *   }
 * }
 *
 * @example
 * // Cognito implementation expects pre-validated claims
 * class CognitoAuthService implements AuthService<{ claims?: { sub: string; email: string } }> {
 *   async authenticate(input) {
 *     if (input.claims) {
 *       return createPrincipal(input.claims.sub, input.claims.email);
 *     }
 *     return null;
 *   }
 * }
 */
export interface AuthService<TAuthInput = any> {
    /**
     * Authenticate from the provided input and return Principal
     *
     * The input structure is defined by each implementation.
     * This method should:
     * - Extract authentication information from input
     * - Validate credentials (tokens, sessions, claims, etc.)
     * - Return a Principal if authentication succeeds
     * - Return null if authentication fails
     *
     * @param input - Authentication input (type defined by implementation)
     * @returns Principal if authenticated, null otherwise
     */
    authenticate(input: TAuthInput): Promise<Principal | null>;
}
