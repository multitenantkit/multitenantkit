import type { UuidPort } from '@multitenantkit/domain-contracts';

/**
 * Mock implementation of UuidPort for testing
 * Allows controlling UUID generation for deterministic tests
 */
export class MockUuidPort implements UuidPort {
    private nextUuid: string;
    private counter: number = 0;

    constructor(initialUuid: string = 'mock-uuid') {
        this.nextUuid = initialUuid;
    }

    generate(): string {
        const uuid = this.nextUuid;
        // Auto-increment for multiple calls unless explicitly set
        this.counter++;
        if (this.nextUuid.includes('mock-uuid')) {
            this.nextUuid = `mock-uuid-${this.counter}`;
        }
        return uuid;
    }

    setNextUuid(uuid: string): void {
        this.nextUuid = uuid;
    }

    setSequentialUuids(baseUuid: string): void {
        this.nextUuid = `${baseUuid}-${this.counter}`;
    }

    resetCounter(): void {
        this.counter = 0;
    }
}
