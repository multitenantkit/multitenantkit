import { Request, Response, NextFunction } from 'express';
import { Principal, ANONYMOUS_PRINCIPAL } from '@multitenantkit/domain-contracts/shared/auth';
import { AuthService } from '@multitenantkit/api-contracts/shared/ports';

/**
 * Create Express middleware for authentication
 *
 * This middleware uses the provided AuthService to authenticate requests
 * and attaches the resulting Principal to the request object
 *
 * @param authService - The auth service implementation to use
 * @returns Express middleware function
 */
export function createAuthMiddleware(authService: AuthService<any>) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Build authentication input from Express request
            const authInput = {
                headers: req.headers as Record<string, string>,
                cookies: req.cookies
            };

            // Authenticate using the provided service
            const principal = await authService.authenticate(authInput);

            // Attach principal to request (null → ANONYMOUS_PRINCIPAL)
            req.principal = principal || ANONYMOUS_PRINCIPAL;

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            // On error, set anonymous principal and continue
            req.principal = ANONYMOUS_PRINCIPAL;
            next();
        }
    };
}

// Extend Express Request type to include principal
declare global {
    namespace Express {
        interface Request {
            principal?: Principal;
        }
    }
}
