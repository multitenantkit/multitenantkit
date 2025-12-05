// Supabase Edge Functions Transport Adapter for MultiTenantKit

// Main builder
export { buildEdgeFunction } from './buildEdgeFunction';
// Middleware utilities (for custom implementations)
export { authenticateRequest } from './middleware/auth';
export { buildCorsHeaders, handleCorsPreflightRequest } from './middleware/cors';
export { getRequestId } from './middleware/requestId';
export { validateRequest } from './middleware/validation';
// Router (for advanced use cases)
export { EdgeRouter } from './router';

// Types
export type { CorsOptions, EdgeContext, EdgeFunctionOptions, RouteMatch } from './types';
