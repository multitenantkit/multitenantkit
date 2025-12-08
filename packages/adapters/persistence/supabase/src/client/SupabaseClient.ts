/**
 * Supabase Client Wrapper
 *
 * Provides a configured Supabase client for use in repositories.
 * Works in both Node.js and Deno/Edge Functions environments.
 */

import { createClient, type SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

/**
 * Configuration for Supabase client
 */
export interface SupabaseConfig {
    /** Supabase project URL */
    url: string;
    /** Supabase service role key (for server-side operations) */
    serviceRoleKey: string;
}

/**
 * Create Supabase configuration from environment variables
 */
export function createSupabaseConfig(): SupabaseConfig {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
        throw new Error('SUPABASE_URL environment variable is required');
    }

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }

    return { url, serviceRoleKey };
}

/**
 * Create a Supabase client instance
 *
 * @param config - Supabase configuration
 * @returns Configured Supabase client
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClientType {
    return createClient(config.url, config.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// Re-export the type for convenience
export type { SupabaseClientType as SupabaseClient };
