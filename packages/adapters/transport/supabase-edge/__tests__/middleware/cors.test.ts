import { describe, expect, it } from 'vitest';
import { buildCorsHeaders, handleCorsPreflightRequest } from '../../src/middleware/cors';

describe('CORS Middleware', () => {
    describe('buildCorsHeaders', () => {
        it('should build default CORS headers', () => {
            const headers = buildCorsHeaders();

            expect(headers['Access-Control-Allow-Origin']).toBe('*');
            expect(headers['Access-Control-Allow-Headers']).toContain('authorization');
            expect(headers['Access-Control-Allow-Methods']).toContain('GET');
        });

        it('should accept custom origin string', () => {
            const headers = buildCorsHeaders({
                allowOrigin: 'https://example.com',
                allowHeaders: ['content-type'],
                allowMethods: ['GET', 'POST']
            });

            expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
        });

        it('should join multiple origins', () => {
            const headers = buildCorsHeaders({
                allowOrigin: ['https://a.com', 'https://b.com'],
                allowHeaders: ['content-type'],
                allowMethods: ['GET']
            });

            expect(headers['Access-Control-Allow-Origin']).toBe('https://a.com, https://b.com');
        });

        it('should join headers and methods', () => {
            const headers = buildCorsHeaders({
                allowOrigin: '*',
                allowHeaders: ['authorization', 'content-type', 'x-custom'],
                allowMethods: ['GET', 'POST', 'DELETE']
            });

            expect(headers['Access-Control-Allow-Headers']).toBe(
                'authorization, content-type, x-custom'
            );
            expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, DELETE');
        });

        it('should include maxAge when provided', () => {
            const headers = buildCorsHeaders({
                allowOrigin: '*',
                allowHeaders: ['content-type'],
                allowMethods: ['GET'],
                maxAge: 86400
            });

            expect(headers['Access-Control-Max-Age']).toBe('86400');
        });

        it('should not include maxAge when not provided', () => {
            const headers = buildCorsHeaders({
                allowOrigin: '*',
                allowHeaders: ['content-type'],
                allowMethods: ['GET']
            });

            expect(headers['Access-Control-Max-Age']).toBeUndefined();
        });
    });

    describe('handleCorsPreflightRequest', () => {
        it('should return Response with status 200', async () => {
            const corsHeaders = buildCorsHeaders();
            const response = handleCorsPreflightRequest(corsHeaders);

            expect(response).toBeInstanceOf(Response);
            expect(response.status).toBe(200);
        });

        it('should return "ok" body', async () => {
            const corsHeaders = buildCorsHeaders();
            const response = handleCorsPreflightRequest(corsHeaders);
            const body = await response.text();

            expect(body).toBe('ok');
        });

        it('should include CORS headers in response', async () => {
            const corsHeaders = buildCorsHeaders({
                allowOrigin: 'https://test.com',
                allowHeaders: ['authorization'],
                allowMethods: ['GET']
            });
            const response = handleCorsPreflightRequest(corsHeaders);

            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://test.com');
            expect(response.headers.get('Access-Control-Allow-Headers')).toBe('authorization');
            expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
        });
    });
});
