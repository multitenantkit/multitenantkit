/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        testTimeout: 10000
    },
    resolve: {
        alias: {
            'multitenantkit/domain': resolve(__dirname, '../domain/src'),
            'multitenantkit/composition': resolve(__dirname, 'src'),
            'multitenantkit/adapter-persistence-json': resolve(
                __dirname,
                '../adapters/db/json/src'
            )
        }
    }
});
