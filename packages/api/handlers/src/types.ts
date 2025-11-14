import type { Principal } from '@multitenantkit/domain-contracts/shared/auth/Principal';

/**
 * HTTP Handler types - Transport agnostic
 * These handlers are independent of Express, Lambda, etc.
 */
export type Handler<I, O> = (ctx: {
    input: I;
    principal?: Principal;
    requestId: string;
}) => Promise<{
    status: number;
    body: O;
    headers?: Record<string, string>;
}>;

/**
 * Route definition for a handler
 */
export interface RouteDefinition {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    auth: 'required' | 'optional' | 'none';
}

/**
 * Complete handler package with route, schema, and handler
 */
export interface HandlerPackage<I, O> {
    route: RouteDefinition;
    schema: any; // Zod schema for input validation
    handler: Handler<I, O>;
}
