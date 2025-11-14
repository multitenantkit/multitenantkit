/// <reference types="vitest" />

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        testTimeout: 15000, // Higher timeout for API tests
        setupFiles: ['__tests__/setup.ts']
    },
    resolve: {
        alias: {
            'multitenantkit/http-handlers': resolve(__dirname, '../http-handlers/src')
        }
    }
});
