import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware to generate and attach request ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
    // Check if request ID is already provided in headers
    const existingRequestId = req.headers['x-request-id'] as string;

    // Generate new request ID if not provided
    const requestId = existingRequestId || randomUUID();

    // Add to request object for use in handlers
    req.requestId = requestId;

    // Add to response headers
    res.setHeader('X-Request-ID', requestId);

    next();
}

// Extend Express Request type to include request ID
declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}
