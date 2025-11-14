import { MockUnitOfWork } from '../test-doubles/MockUnitOfWork';
import type { MockUserRepository } from '../test-doubles/MockUserRepository';
import { TestData } from './Builders';
import { DeterministicUuid, FixedClock } from './TestDoubles';

/**
 * Test setup utility that provides common testing infrastructure
 */
export class TestSetup {
    public readonly uow: MockUnitOfWork;
    public readonly userRepo: MockUserRepository<Record<string, unknown>>;
    public readonly clock: FixedClock;
    public readonly uuid: DeterministicUuid;

    constructor() {
        this.uow = new MockUnitOfWork();
        // biome-ignore lint/complexity/noBannedTypes: Empty object {} for user custom fields
        this.userRepo = this.uow.getUserRepository() as MockUserRepository<{}>;
        this.clock = new FixedClock();
        this.uuid = new DeterministicUuid();
    }

    /**
     * Clear all repositories and reset UUID counter
     */
    reset(): void {
        this.uow.reset();
        this.uuid.reset();
    }

    /**
     * Setup a basic scenario with owner, admin, member users and a organization
     */
    async setupBasicScenario(): Promise<{
        owner: any;
        admin: any;
        member: any;
    }> {
        // Create users
        const owner = TestData.ownerUser().build();
        const admin = TestData.adminUser().build();
        const member = TestData.memberUser().build();

        await this.userRepo.insert(owner);
        await this.userRepo.insert(admin);
        await this.userRepo.insert(member);

        return {
            owner,
            admin,
            member
        };
    }
}

/**
 * Common assertion helpers for domain tests
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class TestAssertions {
    /**
     * Assert that a Result is successful and return the value
     */
    static expectSuccess<T>(result: any): T {
        if (result.isFailure) {
            throw new Error(`Expected success but got failure: ${result.getError().message}`);
        }
        return result.getValue();
    }

    /**
     * Assert that a Result is a failure with specific error code
     */
    static expectFailure(result: any, expectedErrorCode?: string): any {
        if (result.isSuccess) {
            throw new Error(
                `Expected failure but got success: ${JSON.stringify(result.getValue())}`
            );
        }

        const error = result.getError();
        if (expectedErrorCode && error.code !== expectedErrorCode) {
            throw new Error(
                `Expected error code '${expectedErrorCode}' but got '${error.code}': ${error.message}`
            );
        }

        return error;
    }

    /**
     * Assert that an array contains exactly the expected number of items
     */
    static expectArrayLength<T>(array: T[], expectedLength: number): T[] {
        if (array.length !== expectedLength) {
            throw new Error(`Expected array length ${expectedLength} but got ${array.length}`);
        }
        return array;
    }

    /**
     * Assert that a date is approximately equal to another (within tolerance)
     */
    static expectDateNear(actual: Date, expected: Date, toleranceMs: number = 1000): void {
        const diff = Math.abs(actual.getTime() - expected.getTime());
        if (diff > toleranceMs) {
            throw new Error(
                `Expected date ${actual.toISOString()} to be within ${toleranceMs}ms of ${expected.toISOString()}, but difference was ${diff}ms`
            );
        }
    }

    /**
     * Assert that a value is defined (not null or undefined)
     */
    static expectDefined<T>(value: T | null | undefined): T {
        if (value === null || value === undefined) {
            throw new Error(`Expected value to be defined but got ${value}`);
        }
        return value;
    }
}

/**
 * Convenience function to create a new test setup
 */
export function createTestSetup(): TestSetup {
    return new TestSetup();
}

/**
 * Common test data scenarios
 */
export const TestScenarios = {
    /**
     * Basic scenario: 1 organization, 3 users (owner, admin, member)
     */
    async basic(setup: TestSetup) {
        return await setup.setupBasicScenario();
    },

    /**
     * Empty scenario: no data
     */
    empty() {
        return {};
    }
};
