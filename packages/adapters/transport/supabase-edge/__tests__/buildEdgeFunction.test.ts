import type { AuthService } from '@multitenantkit/api-contracts/shared/ports';
import type { HandlerPackage } from '@multitenantkit/api-handlers';
import { ANONYMOUS_PRINCIPAL, type Principal } from '@multitenantkit/domain-contracts/shared/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { buildEdgeFunction } from '../src/buildEdgeFunction';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Create a mock AuthService for testing
 */
function createMockAuthService(
    defaultPrincipal: Principal | null = { authProviderId: 'user-123' }
): AuthService<unknown> & { authenticate: ReturnType<typeof vi.fn> } {
    return {
        authenticate: vi.fn().mockResolvedValue(defaultPrincipal)
    };
}

/**
 * Create a mock handler package for testing
 */
function createMockHandler(
    method: HttpMethod,
    path: string,
    auth: 'required' | 'optional' | 'none',
    schema: z.ZodSchema,
    response: { status: number; body: unknown }
): HandlerPackage<unknown, unknown> {
    return {
        route: { method, path, auth },
        schema,
        handler: vi.fn().mockResolvedValue(response)
    };
}

describe('buildEdgeFunction', () => {
    let mockAuthService: ReturnType<typeof createMockAuthService>;

    beforeEach(() => {
        mockAuthService = createMockAuthService();
    });

    describe('CORS handling', () => {
        it('should handle OPTIONS preflight request', async () => {
            const handlers: HandlerPackage<unknown, unknown>[] = [];
            const edgeHandler = buildEdgeFunction(handlers, mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/test', {
                method: 'OPTIONS'
            });

            const response = await edgeHandler(request);

            expect(response.status).toBe(200);
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
            expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
        });

        it('should include CORS headers in all responses', async () => {
            const handler = createMockHandler(
                'GET',
                '/test',
                'none',
                z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                { status: 200, body: { data: 'test' } }
            );

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/test', {
                method: 'GET'
            });

            const response = await edgeHandler(request);

            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        });

        it('should use custom CORS configuration', async () => {
            const handlers: HandlerPackage<unknown, unknown>[] = [];
            const edgeHandler = buildEdgeFunction(handlers, mockAuthService, {
                basePath: '/api',
                cors: {
                    allowOrigin: 'https://custom.com',
                    allowHeaders: ['x-custom'],
                    allowMethods: ['GET']
                }
            });

            const request = new Request('https://example.com/api/test', {
                method: 'OPTIONS'
            });

            const response = await edgeHandler(request);

            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://custom.com');
        });
    });

    describe('health check', () => {
        it('should return healthy status on GET /health', async () => {
            const edgeHandler = buildEdgeFunction([], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/health', {
                method: 'GET'
            });

            const response = await edgeHandler(request);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.status).toBe('healthy');
            expect(body.timestamp).toBeDefined();
            expect(body.requestId).toBeDefined();
        });

        it('should include X-Request-ID header', async () => {
            const edgeHandler = buildEdgeFunction([], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/health', {
                method: 'GET'
            });

            const response = await edgeHandler(request);

            expect(response.headers.get('X-Request-ID')).toBeDefined();
        });
    });

    describe('routing', () => {
        it('should return 404 for unmatched routes', async () => {
            const edgeHandler = buildEdgeFunction([], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/unknown', {
                method: 'GET'
            });

            const response = await edgeHandler(request);
            const body = await response.json();

            expect(response.status).toBe(404);
            expect(body.error.code).toBe('NOT_FOUND');
        });

        it('should route to correct handler', async () => {
            const handler = createMockHandler(
                'GET',
                '/users/me',
                'none',
                z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                { status: 200, body: { id: 'user-123' } }
            );

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/users/me', {
                method: 'GET'
            });

            const response = await edgeHandler(request);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.id).toBe('user-123');
        });
    });

    describe('authentication', () => {
        it('should return 401 for required auth without token', async () => {
            mockAuthService.authenticate.mockResolvedValue(ANONYMOUS_PRINCIPAL);

            const handler = createMockHandler(
                'GET',
                '/protected',
                'required',
                z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                { status: 200, body: {} }
            );

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/protected', {
                method: 'GET'
            });

            const response = await edgeHandler(request);
            const body = await response.json();

            expect(response.status).toBe(401);
            expect(body.error.code).toBe('UNAUTHORIZED');
        });

        it('should allow authenticated request to protected route', async () => {
            const handler = createMockHandler(
                'GET',
                '/protected',
                'required',
                z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                { status: 200, body: { secret: 'data' } }
            );

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/protected', {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer valid-token'
                }
            });

            const response = await edgeHandler(request);

            expect(response.status).toBe(200);
        });

        it('should allow anonymous access to optional auth routes', async () => {
            mockAuthService.authenticate.mockResolvedValue(ANONYMOUS_PRINCIPAL);

            const handler = createMockHandler(
                'GET',
                '/optional',
                'optional',
                z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                { status: 200, body: { public: true } }
            );

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/optional', {
                method: 'GET'
            });

            const response = await edgeHandler(request);

            expect(response.status).toBe(200);
        });

        it('should skip auth for none auth routes', async () => {
            const handler = createMockHandler(
                'GET',
                '/public',
                'none',
                z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                { status: 200, body: { public: true } }
            );

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/public', {
                method: 'GET'
            });

            const response = await edgeHandler(request);

            expect(response.status).toBe(200);
            expect(mockAuthService.authenticate).not.toHaveBeenCalled();
        });
    });

    describe('validation', () => {
        it('should return 400 for invalid request body', async () => {
            const handler = createMockHandler(
                'POST',
                '/users',
                'none',
                z.object({
                    body: z.object({
                        email: z.string().email()
                    }),
                    params: z.object({}),
                    query: z.object({})
                }),
                { status: 201, body: {} }
            );

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'invalid' })
            });

            const response = await edgeHandler(request);
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should pass validated input to handler', async () => {
            const handlerFn = vi.fn().mockResolvedValue({ status: 201, body: { created: true } });
            const handler: HandlerPackage<unknown, unknown> = {
                route: { method: 'POST', path: '/users', auth: 'none' },
                schema: z.object({
                    body: z.object({
                        name: z.string(),
                        email: z.string().email()
                    }),
                    params: z.object({}),
                    query: z.object({})
                }),
                handler: handlerFn
            };

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'John', email: 'john@example.com' })
            });

            await edgeHandler(request);

            expect(handlerFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: {
                        body: { name: 'John', email: 'john@example.com' },
                        params: {},
                        query: {}
                    }
                })
            );
        });
    });

    describe('error handling', () => {
        it('should return 500 for handler errors', async () => {
            const handler: HandlerPackage<unknown, unknown> = {
                route: { method: 'GET', path: '/error', auth: 'none' },
                schema: z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                handler: vi.fn().mockRejectedValue(new Error('Internal error'))
            };

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/error', {
                method: 'GET'
            });

            const response = await edgeHandler(request);
            const body = await response.json();

            expect(response.status).toBe(500);
            expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
        });

        it('should include requestId in error responses', async () => {
            const edgeHandler = buildEdgeFunction([], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/unknown', {
                method: 'GET',
                headers: {
                    'x-request-id': 'test-request-id'
                }
            });

            const response = await edgeHandler(request);
            const body = await response.json();

            expect(body.error.requestId).toBe('test-request-id');
            expect(response.headers.get('X-Request-ID')).toBe('test-request-id');
        });
    });

    describe('response handling', () => {
        it('should return correct status code from handler', async () => {
            const handler = createMockHandler(
                'POST',
                '/users',
                'none',
                z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                { status: 201, body: { id: 'new-user' } }
            );

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const response = await edgeHandler(request);

            expect(response.status).toBe(201);
        });

        it('should include custom headers from handler', async () => {
            const handler: HandlerPackage<unknown, unknown> = {
                route: { method: 'GET', path: '/custom', auth: 'none' },
                schema: z.object({
                    body: z.object({}).optional(),
                    params: z.object({}),
                    query: z.object({})
                }),
                handler: vi.fn().mockResolvedValue({
                    status: 200,
                    body: {},
                    headers: { 'X-Custom-Header': 'custom-value' }
                })
            };

            const edgeHandler = buildEdgeFunction([handler], mockAuthService, {
                basePath: '/api'
            });

            const request = new Request('https://example.com/api/custom', {
                method: 'GET'
            });

            const response = await edgeHandler(request);

            expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
        });
    });
});
