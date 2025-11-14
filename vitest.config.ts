/// <reference types="vitest" />

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'coverage/**',
                'dist/**',
                '**/[.]**',
                'packages/*/test{,s}/**',
                '**/*.d.ts',
                '**/virtual:*',
                '**/__x00__*',
                '**/\x00*',
                'cypress/**',
                'test{,s}/**',
                'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
                '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
                '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
                '**/tests/**',
                '**/__tests__/**'
            ]
        },
        testTimeout: 10000,
        hookTimeout: 10000
    },
    resolve: {
        alias: {
            'multitenantkit/domain': resolve(__dirname, 'packages/domain/src'),
            'multitenantkit/composition': resolve(__dirname, 'packages/composition/src'),
            'multitenantkit/http-handlers': resolve(__dirname, 'packages/api/http-handlers/src'),
            'multitenantkit/api-express': resolve(__dirname, 'packages/api/api-express/src'),
            'multitenantkit/adapter-persistence-json': resolve(
                __dirname,
                'packages/adapters/db/json/src'
            )
        }
    }
});
