// Authentication middleware for Supabase Edge Functions

import type { AuthService } from '@multitenantkit/api-contracts/shared/ports';
import { ANONYMOUS_PRINCIPAL, type Principal } from '@multitenantkit/domain-contracts/shared/auth';

/**
 * Authenticate a request using the provided AuthService
 * Adapts Deno Request headers to the format expected by AuthService
 */
export async function authenticateRequest(
    request: Request,
    authService: AuthService<unknown>
): Promise<Principal> {
    try {
        // Convert Deno Headers to Record<string, string>
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
        });

        // Build auth input (compatible with SupabaseAuthService)
        const authInput = {
            headers,
            cookies: {} // Edge Functions typically use header-based auth
        };

        const principal = await authService.authenticate(authInput);

        return principal || ANONYMOUS_PRINCIPAL;
    } catch (error) {
        console.error('Authentication error:', error);
        return ANONYMOUS_PRINCIPAL;
    }
}
