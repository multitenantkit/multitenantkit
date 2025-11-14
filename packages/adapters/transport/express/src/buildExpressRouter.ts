import type { AuthService } from '@multitenantkit/api-contracts/shared/ports';

import type { HandlerPackage } from '@multitenantkit/api-handlers';
import { type Request, type Response, Router } from 'express';
import { createAuthMiddleware } from './auth';
import { validateRequest } from './middleware';

/**
 * Build an Express Router from handler packages
 * This allows mounting the router in an existing Express app with a custom prefix
 *
 * This is useful when you want to integrate the framework into an existing application
 * and mount all routes under a specific path (e.g., /api/organizations, /organization-base, etc.)
 *
 * @param handlerPackages - Array of handler packages to register as routes
 * @param authService - Auth service implementation for authentication
 * @returns Express Router ready to be mounted
 *
 * @example
 * ```typescript
 * // Mount in existing Express app
 * const handlerPackages = buildHandlers(useCases, frameworkConfig);
 * const router = buildExpressRouter(handlerPackages, authService);
 * existingApp.use('/api/organizations', router);
 * ```
 */
export function buildExpressRouter(
    handlerPackages: HandlerPackage<any, any>[],
    authService: AuthService<any>
): Router {
    const router = Router();

    // Create auth middleware with injected service
    const authMiddleware = createAuthMiddleware(authService);

    // Register handler packages as routes
    handlerPackages.forEach((pkg) => {
        const { route, schema, handler } = pkg;

        // Determine authentication middleware
        const authRequired = route.auth === 'required';
        const authOptional = route.auth === 'optional';

        // Build middleware chain
        const middlewares = [];

        // Add authentication middleware
        if (authRequired || authOptional) {
            middlewares.push(authMiddleware);
        }

        // Add validation middleware
        middlewares.push(validateRequest(schema));

        // Convert handler to Express route handler
        const expressHandler = async (req: Request, res: Response) => {
            const result = await handler({
                input: req.validatedInput || req.validatedBody,
                principal: req.principal,
                requestId: req.requestId
            });

            // Set headers if provided
            if (result.headers) {
                Object.entries(result.headers).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
            }

            // Send response
            res.status(result.status).json(result.body);
        };

        // Register route with Router
        const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
        router[method](route.path, ...middlewares, expressHandler);

        console.log(`📍 Registered ${route.method} ${route.path} (auth: ${route.auth})`);
    });

    return router;
}
