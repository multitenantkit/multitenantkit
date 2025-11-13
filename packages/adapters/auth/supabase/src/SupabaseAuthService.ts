import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Principal, createPrincipal } from '@multitenantkit/domain-contracts/shared/auth';
import { AuthService } from '@multitenantkit/api-contracts/shared/ports';
import { SupabaseAuthInput } from './SupabaseAuthInput';

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

    constructor(private config: SupabaseAuthConfig) {
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
            const authHeader = input.headers['authorization'] || input.headers['Authorization'];

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
    SUPABASE_SERVICE_KEY: string;
}

/**
 * Factory function to create SupabaseAuthService with environment variables
 *
 * @throws Error if required environment variables are missing
 */
export function createSupabaseAuthService(
    config?: SupabaseAuthEnvironmentVariables
): SupabaseAuthService {
    const supabaseUrl = config?.SUPABASE_URL ?? process.env.SUPABASE_URL;
    const supabaseServiceKey = config?.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            'Missing required variables: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set from config or environment variables'
        );
    }

    return new SupabaseAuthService({
        supabaseUrl,
        supabaseServiceKey
    });
}
