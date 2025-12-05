/**
 * Web Crypto UUID Generator
 *
 * Uses the Web Crypto API (crypto.randomUUID()) which is available in:
 * - Deno
 * - Modern browsers
 * - Node.js 19+
 *
 * This is Deno/Edge Functions compatible - no Node.js dependencies.
 */

import type { UuidPort } from '@multitenantkit/domain-contracts';

/**
 * UUID generator using Web Crypto API
 */
export class WebCryptoUuid implements UuidPort {
    /**
     * Generate a new UUID v4
     */
    generate(): string {
        return crypto.randomUUID();
    }
}
