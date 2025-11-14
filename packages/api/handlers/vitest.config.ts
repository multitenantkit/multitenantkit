/// <reference types="vitest" />

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        testTimeout: 5000
    },
    resolve: {
        alias: {
            'multitenantkit/http-handlers': resolve(__dirname, 'src')
        }
    }
});
