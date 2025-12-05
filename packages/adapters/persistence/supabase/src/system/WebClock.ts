/**
 * Web Clock
 *
 * Simple clock implementation using standard Date API.
 * Deno/Edge Functions compatible - no Node.js dependencies.
 */

import type { ClockPort } from '@multitenantkit/domain-contracts';

/**
 * Clock implementation using standard Date API
 */
export class WebClock implements ClockPort {
    /**
     * Get the current date/time
     */
    now(): Date {
        return new Date();
    }
}
