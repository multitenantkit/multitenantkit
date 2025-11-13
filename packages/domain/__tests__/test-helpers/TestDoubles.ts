import { ClockPort, UuidPort } from '@multitenantkit/domain-contracts';

/**
 * Fixed clock for deterministic testing
 */
export class FixedClock implements ClockPort {
    constructor(private readonly fixedDate: Date = new Date('2025-01-15T12:00:00.000Z')) {}

    now(): Date {
        return new Date(this.fixedDate);
    }

    setTime(date: Date): void {
        this.fixedDate.setTime(date.getTime());
    }
}

/**
 * Deterministic UUID generator for testing
 * Generates valid UUID v4 format for testing purposes
 */
export class DeterministicUuid implements UuidPort {
    private counter = 1;

    constructor() {}

    generate(): string {
        // Generate a valid UUID v4 format with deterministic values
        const hex = this.counter.toString(16).padStart(12, '0');
        this.counter++;

        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-8${hex.slice(2, 3)}${hex.slice(4, 6)}-${hex}`;
    }

    reset(): void {
        this.counter = 1;
    }
}

/**
 * Mock UUID generator that returns specific UUIDs in sequence
 */
export class MockUuid implements UuidPort {
    private index = 0;

    constructor(private readonly uuids: string[]) {}

    generate(): string {
        if (this.index >= this.uuids.length) {
            throw new Error(
                `MockUuid: No more UUIDs available. Requested ${this.index + 1}, but only ${
                    this.uuids.length
                } provided.`
            );
        }
        return this.uuids[this.index++];
    }

    reset(): void {
        this.index = 0;
    }
}
