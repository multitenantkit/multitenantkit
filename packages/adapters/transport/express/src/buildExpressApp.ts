import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { HandlerPackage } from '@multitenantkit/api-handlers';
import { requestIdMiddleware, errorHandler, notFoundHandler } from './middleware';
import { AuthService } from '@multitenantkit/api-contracts/shared/ports';
import { buildExpressRouter } from './buildExpressRouter';

/**
 * Build a complete Express application from handler packages
 * This creates a standalone Express app with all middleware configured
 *
 * This function is ideal for new projects where you want a complete
 * Express server with all features configured out of the box.
 *
 * @param handlerPackages - Array of handler packages to register as routes
 * @param authService - Auth service implementation for authentication
 * @returns Configured Express application ready to listen
 *
 * @example
 * ```typescript
 * // Standalone Express app
 * const handlerPackages = buildHandlers(useCases, frameworkConfig);
 * const app = buildExpressApp(handlerPackages, authService);
 * app.listen(3001);
 * ```
 */
export function buildExpressApp(
    handlerPackages: HandlerPackage<any, any>[],
    authService: AuthService<any>
): Express {
    const app = express();

    // Global middleware
    app.use(helmet()); // Security headers
    app.use(cors()); // CORS support
    app.use(express.json({ limit: '10mb' })); // JSON body parser
    app.use(express.urlencoded({ extended: true })); // URL encoded parser
    app.use(requestIdMiddleware); // Request ID generation

    // Logging middleware (only in development)
    if (process.env.NODE_ENV !== 'production') {
        app.use(morgan('combined'));
    }

    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        });
    });

    // Mount the router (reusing buildExpressRouter for DRY principle)
    const router = buildExpressRouter(handlerPackages, authService);
    app.use('/', router);

    // 404 handler for unmatched routes
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    return app;
}
