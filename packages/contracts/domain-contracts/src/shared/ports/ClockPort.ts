/**
 * Port for clock/time operations
 * Allows testing with fixed time and different time zones
 */
export interface ClockPort {
    now(): Date;
}
