import type { HandlerPackage } from '@multitenantkit/api-handlers';
import { describe, expect, it } from 'vitest';
import { EdgeRouter } from '../src/router';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Mock handler packages for testing
 */
function createMockHandler(
    method: HttpMethod,
    path: string,
    auth: 'required' | 'optional' | 'none' = 'required'
): HandlerPackage<unknown, unknown> {
    return {
        route: { method, path, auth },
        schema: {} as any,
        handler: async () => ({ status: 200, body: {} })
    };
}

describe('EdgeRouter', () => {
    describe('constructor', () => {
        it('should create router with base path and handlers', () => {
            const handlers = [createMockHandler('GET', '/users/me')];
            const router = new EdgeRouter('/api', handlers);

            expect(router).toBeInstanceOf(EdgeRouter);
        });

        it('should handle empty handlers array', () => {
            const router = new EdgeRouter('/api', []);

            expect(router.match('GET', '/api/anything')).toBeNull();
        });
    });

    describe('match', () => {
        describe('exact path matching', () => {
            it('should match exact paths', () => {
                const handlers = [createMockHandler('GET', '/users/me')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match('GET', '/api/users/me');

                expect(match).not.toBeNull();
                expect(match?.params).toEqual({});
            });

            it('should match POST method', () => {
                const handlers = [createMockHandler('POST', '/users')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match('POST', '/api/users');

                expect(match).not.toBeNull();
            });

            it('should match case-insensitive methods', () => {
                const handlers = [createMockHandler('GET', '/users/me')];
                const router = new EdgeRouter('/api', handlers);

                const matchLower = router.match('get', '/api/users/me');
                const matchUpper = router.match('GET', '/api/users/me');

                expect(matchLower).not.toBeNull();
                expect(matchUpper).not.toBeNull();
            });
        });

        describe('path parameter extraction', () => {
            it('should extract single path parameter', () => {
                const handlers = [createMockHandler('GET', '/organizations/:id')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match('GET', '/api/organizations/123');

                expect(match).not.toBeNull();
                expect(match?.params).toEqual({ id: '123' });
            });

            it('should extract multiple path parameters', () => {
                const handlers = [
                    createMockHandler('GET', '/organizations/:organizationId/memberships/:memberId')
                ];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match(
                    'GET',
                    '/api/organizations/org-123/memberships/member-456'
                );

                expect(match).not.toBeNull();
                expect(match?.params).toEqual({
                    organizationId: 'org-123',
                    memberId: 'member-456'
                });
            });

            it('should handle UUID-like parameters', () => {
                const handlers = [createMockHandler('GET', '/organizations/:id')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match(
                    'GET',
                    '/api/organizations/550e8400-e29b-41d4-a716-446655440000'
                );

                expect(match).not.toBeNull();
                expect(match?.params).toEqual({
                    id: '550e8400-e29b-41d4-a716-446655440000'
                });
            });
        });

        describe('no match scenarios', () => {
            it('should return null for unmatched routes', () => {
                const handlers = [createMockHandler('GET', '/users/me')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match('GET', '/api/unknown');

                expect(match).toBeNull();
            });

            it('should return null for wrong method', () => {
                const handlers = [createMockHandler('GET', '/users/me')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match('POST', '/api/users/me');

                expect(match).toBeNull();
            });

            it('should return null for missing base path', () => {
                const handlers = [createMockHandler('GET', '/users/me')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match('GET', '/users/me');

                expect(match).toBeNull();
            });

            it('should return null for partial path match', () => {
                const handlers = [createMockHandler('GET', '/users/me')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match('GET', '/api/users');

                expect(match).toBeNull();
            });

            it('should return null for path with extra segments', () => {
                const handlers = [createMockHandler('GET', '/users/me')];
                const router = new EdgeRouter('/api', handlers);

                const match = router.match('GET', '/api/users/me/extra');

                expect(match).toBeNull();
            });
        });

        describe('multiple routes', () => {
            it('should match correct route among multiple', () => {
                const handlers = [
                    createMockHandler('GET', '/users/me'),
                    createMockHandler('POST', '/users'),
                    createMockHandler('GET', '/organizations/:id'),
                    createMockHandler('DELETE', '/users/me')
                ];
                const router = new EdgeRouter('/api', handlers);

                const getMe = router.match('GET', '/api/users/me');
                const postUsers = router.match('POST', '/api/users');
                const getOrg = router.match('GET', '/api/organizations/123');
                const deleteMe = router.match('DELETE', '/api/users/me');

                expect(getMe).not.toBeNull();
                expect(postUsers).not.toBeNull();
                expect(getOrg).not.toBeNull();
                expect(getOrg?.params).toEqual({ id: '123' });
                expect(deleteMe).not.toBeNull();
            });
        });

        describe('base path variations', () => {
            it('should work with different base paths', () => {
                const handlers = [createMockHandler('GET', '/users/me')];

                const router1 = new EdgeRouter('/multitenantkit', handlers);
                const router2 = new EdgeRouter('/v1/api', handlers);
                const router3 = new EdgeRouter('', handlers);

                expect(router1.match('GET', '/multitenantkit/users/me')).not.toBeNull();
                expect(router2.match('GET', '/v1/api/users/me')).not.toBeNull();
                expect(router3.match('GET', '/users/me')).not.toBeNull();
            });
        });
    });
});
