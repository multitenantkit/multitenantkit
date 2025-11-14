import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, vi } from 'vitest';

/**
 * Global test setup for API Express tests
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests
process.env.DATA_DIR = path.join(process.cwd(), '__tests__', 'test-data');
process.env.LOG_LEVEL = 'error';

/**
 * Setup test data directory before each test
 */
beforeEach(async () => {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const testDataDir = process.env.DATA_DIR!;

    // Ensure test data directory exists
    await fs.mkdir(testDataDir, { recursive: true });

    // Copy fixture data to test directory
    const fixturesDir = path.join(process.cwd(), '../../adapters/db/json/__tests__/fixtures');

    try {
        const usersData = await fs.readFile(path.join(fixturesDir, 'users.json'), 'utf-8');

        await fs.writeFile(path.join(testDataDir, 'users.json'), usersData);
    } catch (_error) {
        // If fixtures don't exist, create empty files
        await fs.writeFile(path.join(testDataDir, 'users.json'), '[]');
    }
});

/**
 * Cleanup test data after each test
 */
afterEach(async () => {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const testDataDir = process.env.DATA_DIR!;

    try {
        await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (_error) {
        // Ignore cleanup errors
    }
});

/**
 * Mock console methods to reduce test noise
 */
global.console = {
    ...console,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};
