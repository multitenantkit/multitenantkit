import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validateRequest } from '../../src/middleware/validation';

describe('Validation Middleware', () => {
    describe('validateRequest', () => {
        describe('with simple schema', () => {
            const schema = z.object({
                body: z.object({
                    name: z.string(),
                    email: z.string().email()
                }),
                params: z.object({}).optional(),
                query: z.object({}).optional()
            });

            it('should validate valid request body', async () => {
                const request = new Request('https://example.com/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'John', email: 'john@example.com' })
                });
                const url = new URL(request.url);

                const result = await validateRequest(request, url, {}, schema);

                expect(result.success).toBe(true);
                expect(result.data).toEqual({
                    body: { name: 'John', email: 'john@example.com' },
                    params: {},
                    query: {}
                });
            });

            it('should fail for invalid email', async () => {
                const request = new Request('https://example.com/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'John', email: 'invalid-email' })
                });
                const url = new URL(request.url);

                const result = await validateRequest(request, url, {}, schema);

                expect(result.success).toBe(false);
                expect(result.errors).toBeDefined();
                expect(result.errors?.some((e) => e.field.includes('email'))).toBe(true);
            });

            it('should fail for missing required field', async () => {
                const request = new Request('https://example.com/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'john@example.com' })
                });
                const url = new URL(request.url);

                const result = await validateRequest(request, url, {}, schema);

                expect(result.success).toBe(false);
                expect(result.errors?.some((e) => e.field.includes('name'))).toBe(true);
            });
        });

        describe('with path parameters', () => {
            const schema = z.object({
                body: z.object({}).optional(),
                params: z.object({
                    id: z.string().uuid()
                }),
                query: z.object({}).optional()
            });

            it('should validate valid UUID parameter', async () => {
                const request = new Request('https://example.com/orgs/123', {
                    method: 'GET'
                });
                const url = new URL(request.url);
                const params = { id: '550e8400-e29b-41d4-a716-446655440000' };

                const result = await validateRequest(request, url, params, schema);

                expect(result.success).toBe(true);
            });

            it('should fail for invalid UUID parameter', async () => {
                const request = new Request('https://example.com/orgs/invalid', {
                    method: 'GET'
                });
                const url = new URL(request.url);
                const params = { id: 'not-a-uuid' };

                const result = await validateRequest(request, url, params, schema);

                expect(result.success).toBe(false);
                expect(result.errors?.some((e) => e.field.includes('id'))).toBe(true);
            });
        });

        describe('with query parameters', () => {
            const schema = z.object({
                body: z.object({}).optional(),
                params: z.object({}).optional(),
                query: z.object({
                    page: z.string().regex(/^\d+$/),
                    limit: z.string().regex(/^\d+$/).optional()
                })
            });

            it('should validate query parameters from URL', async () => {
                const request = new Request('https://example.com/items?page=1&limit=10', {
                    method: 'GET'
                });
                const url = new URL(request.url);

                const result = await validateRequest(request, url, {}, schema);

                expect(result.success).toBe(true);
            });

            it('should fail for invalid query parameter', async () => {
                const request = new Request('https://example.com/items?page=abc', {
                    method: 'GET'
                });
                const url = new URL(request.url);

                const result = await validateRequest(request, url, {}, schema);

                expect(result.success).toBe(false);
            });
        });

        describe('body parsing', () => {
            const schema = z.object({
                body: z.object({ data: z.string() }),
                params: z.object({}).optional(),
                query: z.object({}).optional()
            });

            it('should handle non-JSON content type gracefully', async () => {
                const request = new Request('https://example.com/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: 'plain text'
                });
                const url = new URL(request.url);

                const result = await validateRequest(request, url, {}, schema);

                // Should fail validation because body is empty object for non-JSON
                expect(result.success).toBe(false);
            });

            it('should handle empty body', async () => {
                const request = new Request('https://example.com/data', {
                    method: 'GET'
                });
                const url = new URL(request.url);

                const result = await validateRequest(request, url, {}, schema);

                expect(result.success).toBe(false);
            });
        });
    });
});
