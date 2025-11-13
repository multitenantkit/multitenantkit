/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        testTimeout: 10000 // Higher timeout for file I/O operations
    },
    resolve: {
        alias: {
            'multitenantkit/adapter-persistence-json': resolve(__dirname, 'src')
        }
    }
});
