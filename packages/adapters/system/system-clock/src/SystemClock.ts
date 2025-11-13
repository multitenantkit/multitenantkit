import { ClockPort } from '@multitenantkit/domain-contracts';

/**
 * System Clock implementation using real system time
 */
export class SystemClock implements ClockPort {
    now(): Date {
        return new Date();
    }
}
