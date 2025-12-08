import type { AuthService } from '@multitenantkit/api-contracts/shared/ports';
import { createPrincipal, type Principal } from '@multitenantkit/domain-contracts/shared/auth';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseAuthInput } from './SupabaseAuthInput';

// Declare Deno type for TypeScript (available at runtime in Deno)
declare const Deno:
    | {
          env: {
              get(key: string): string | undefined;
          };
      }
    | undefined;

/**
 * Get environment variable with runtime detection (Node.js or Deno)
 *
 * Automatically detects the runtime environment and uses the appropriate
 * method to retrieve environment variables:
 * - Deno: Deno.env.get(key)
 * - Node.js: process.env[key]
 *
 * @param key - Environment variable name
 * @returns The value or undefined if not found
 */
function getEnvVar(key: string): string | undefined {
    // Deno runtime (Supabase Edge Functions)
    if (typeof Deno !== 'undefined') {
        return Deno.env.get(key);
    }
    // Node.js runtime
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    return undefined;
}

/**
 * Configuration for Supabase Auth Service
 */
export interface SupabaseAuthConfig {
    supabaseUrl: string;
    supabaseServiceKey: string;
}

/**
 * Supabase implementation of AuthService
 *
 * This service verifies Supabase JWT tokens from the Authorization header
 * and maps the authenticated user to a Principal object
 */
export class SupabaseAuthService implements AuthService<SupabaseAuthInput> {
    private supabase: SupabaseClient;

    constructor(config: SupabaseAuthConfig) {
        this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    }

    /**
     * Authenticate a request using Supabase JWT token
     *
     * @param input - Contains HTTP headers with Authorization header
     * @returns Principal if token is valid, null otherwise
     */
    async authenticate(input: SupabaseAuthInput): Promise<Principal | null> {
        try {
            // Extract Authorization header
            const authHeader = input.headers.authorization ?? input.headers.Authorization;

            if (!authHeader) {
                return null;
            }

            // Extract token (remove 'Bearer ' prefix if present)
            const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

            // Verify the JWT token with Supabase
            const {
                data: { user },
                error
            } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                console.warn('Supabase JWT verification failed:', error?.message);
                return null;
            }

            // Extract user information
            const userId = user.id;
            const email = user.email;

            if (!userId || !email) {
                console.warn('Invalid user data from Supabase:', {
                    userId,
                    email
                });
                return null;
            }

            // Create and return Principal
            return createPrincipal(userId);
        } catch (error) {
            console.error('Error authenticating with Supabase:', error);
            return null;
        }
    }
}

export interface SupabaseAuthEnvironmentVariables {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Factory function to create SupabaseAuthService with environment variables
 *
 * Works in both Node.js and Deno (Supabase Edge Functions) runtimes.
 *
 * Environment variable lookup order:
 * 1. Explicit config passed as parameter
 * 2. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (Node.js convention)
 * 3. PROJECT_URL / SERVICE_ROLE_KEY (Supabase Edge Functions convention)
 *
 * @param config - Optional explicit configuration
 * @throws Error if required environment variables are missing
 */
export function createSupabaseAuthService(
    config?: Partial<SupabaseAuthEnvironmentVariables>
): SupabaseAuthService {
    // Try config first, then Node.js env var names, then Supabase Edge env var names
    const supabaseUrl =
        config?.SUPABASE_URL ?? getEnvVar('SUPABASE_URL') ?? getEnvVar('PROJECT_URL');

    const supabaseServiceKey =
        config?.SUPABASE_SERVICE_ROLE_KEY ??
        getEnvVar('SUPABASE_SERVICE_ROLE_KEY') ??
        getEnvVar('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            'Missing required variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or PROJECT_URL and SERVICE_ROLE_KEY for Edge Functions) must be set from config or environment variables.'
        );
    }

    return new SupabaseAuthService({
        supabaseUrl,
        supabaseServiceKey
    });
}
