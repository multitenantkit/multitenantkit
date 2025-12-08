/**
 * Edge Function Router
 *
 * Provides Express-style routing for Supabase Edge Functions.
 * Converts HandlerPackages to a routing table with regex-based path matching.
 *
 * @module
 */

import type { HandlerPackage } from '@multitenantkit/api-handlers';
import type { RouteMatch } from './types.js';

/**
 * Internal route entry in the routing table
 */
interface RouteEntry {
    method: string;
    pattern: RegExp;
    paramNames: string[];
    handler: HandlerPackage<unknown, unknown>;
}

/**
 * Route matcher for Supabase Edge Functions.
 *
 * Converts Express-style paths (e.g., `/users/:id`) to regex patterns
 * and matches incoming requests to the appropriate handlers.
 *
 * @example
 * ```typescript
 * import { EdgeRouter } from '@multitenantkit/adapter-transport-supabase-edge';
 *
 * const router = new EdgeRouter('/api', handlers);
 *
 * // Match a request
 * const match = router.match('GET', '/api/organizations/123');
 * if (match) {
 *     console.log(match.params); // { id: '123' }
 *     // Call match.handler...
 * }
 * ```
 */
export class EdgeRouter {
    private routes: RouteEntry[] = [];
    private readonly basePath: string;

    constructor(basePath: string, handlers: HandlerPackage<unknown, unknown>[]) {
        this.basePath = basePath;
        this.registerHandlers(handlers);
    }

    /**
     * Register all handler packages as routes
     */
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Called in constructor - false positive
    private registerHandlers(handlers: HandlerPackage<unknown, unknown>[]): void {
        for (const handler of handlers) {
            const { method, path } = handler.route;
            const { pattern, paramNames } = this.pathToRegex(path);

            this.routes.push({
                method: method.toUpperCase(),
                pattern,
                paramNames,
                handler
            });
        }
    }

    /**
     * Convert Express-style path to regex
     * Example: /users/:id → /^\/users\/([^/]+)$/
     */
    private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
        const paramNames: string[] = [];
        const fullPath = this.basePath + path;

        const regexStr = fullPath
            .replace(/:[a-zA-Z]+/g, (match) => {
                paramNames.push(match.slice(1)); // Remove ':'
                return '([^/]+)';
            })
            .replace(/\//g, '\\/');

        return {
            pattern: new RegExp(`^${regexStr}$`),
            paramNames
        };
    }

    /**
     * Match an incoming request to a registered handler.
     *
     * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH)
     * @param pathname - Full pathname including base path (e.g., '/api/users/123')
     * @returns RouteMatch with handler and extracted params, or null if no match
     */
    match(method: string, pathname: string): RouteMatch | null {
        for (const route of this.routes) {
            if (route.method !== method.toUpperCase()) continue;

            const match = pathname.match(route.pattern);
            if (match) {
                const params: Record<string, string> = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });

                return {
                    handler: route.handler,
                    params
                };
            }
        }

        return null;
    }
}
