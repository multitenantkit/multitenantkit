import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 * Catches any unhandled errors and returns consistent error response
 */
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Log the error for debugging
    console.error('Unhandled error:', {
        message: error.message,
        stack: error.stack,
        requestId: req.requestId,
        url: req.url,
        method: req.method
    });
    
    // Don't handle if response already sent
    if (res.headersSent) {
        return next(error);
    }
    
    // Return consistent error response
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            details: {
                requestId: req.requestId
            }
        }
    });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
    return res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
            details: {
                requestId: req.requestId
            }
        }
    });
}
