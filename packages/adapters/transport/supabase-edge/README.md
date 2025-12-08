# @multitenantkit/adapter-transport-supabase-edge

Supabase Edge Functions transport adapter for MultiTenantKit HTTP API.

This adapter enables running MultiTenantKit API endpoints as a single Supabase Edge Function with internal routing (the "fat function" pattern).

## Features

- **Single Edge Function**: All endpoints run in one function, minimizing cold starts
- **Native Deno**: Uses `Deno.serve()` directly without additional frameworks
- **Full Compatibility**: Works with all `@multitenantkit/api-handlers` HandlerPackages
- **Built-in CORS**: Configurable CORS handling for browser clients
- **Authentication**: Integrates with `@multitenantkit/adapter-auth-supabase` for JWT validation
- **Request Validation**: Zod-based validation for body, params, and query

## Installation

```bash
npm install @multitenantkit/adapter-transport-supabase-edge
```

## Usage

### Basic Setup

```typescript
// supabase/functions/multitenantkit/index.ts

import { buildEdgeFunction } from '@multitenantkit/adapter-transport-supabase-edge';
import { buildHandlers } from '@multitenantkit/api-handlers';
import { createSupabaseAdapters, createUseCases } from '@multitenantkit/sdk-supabase';
import { SupabaseAuthService } from '@multitenantkit/adapter-auth-supabase';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Initialize adapters and use cases
const { adapters, toolkitOptions } = createSupabaseAdapters({ client });
const useCases = createUseCases(adapters, toolkitOptions);
const handlers = buildHandlers(useCases, toolkitOptions);

// Create auth service
const authService = new SupabaseAuthService({
    supabaseUrl: Deno.env.get('SUPABASE_URL')!,
    supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
});

// Build the Edge Function handler
const handler = buildEdgeFunction(handlers, authService, {
    basePath: '/multitenantkit',
    cors: {
        allowOrigin: '*',
        allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    },
    debug: true // Enable for development
});

// Start the server
Deno.serve(handler);
```

### Configuration Options

```typescript
interface EdgeFunctionOptions {
    /** Base path prefix for all routes (usually the function name) */
    basePath: string;

    /** CORS configuration */
    cors?: {
        allowOrigin: string | string[];
        allowHeaders: string[];
        allowMethods: string[];
        maxAge?: number;
    };

    /** Enable debug logging */
    debug?: boolean;
}
```

## Project Structure

For a Supabase project using this adapter:

```
supabase/
├── functions/
│   ├── import_map.json
│   ├── _shared/
│   │   └── multitenantkit.ts    # Shared configuration
│   └── multitenantkit/
│       └── index.ts             # Entry point
├── migrations/
└── config.toml
```

### Supabase Config (`config.toml`)

```toml
[functions.multitenantkit]
verify_jwt = false  # We handle JWT verification ourselves
```

## Available Endpoints

Once deployed, the following 18 endpoints are available (prefixed with your function path):

### Users (5 endpoints)
- `POST /users` - Create user
- `GET /users/me` - Get current user
- `PATCH /users/me` - Update current user
- `DELETE /users/me` - Delete current user
- `GET /users/me/organizations` - List user's organizations

### Organizations (8 endpoints)
- `POST /organizations` - Create organization
- `GET /organizations/:id` - Get organization
- `PATCH /organizations/:id/name` - Update organization
- `DELETE /organizations/:organizationId` - Delete organization
- `POST /organizations/:organizationId/archive` - Archive organization
- `POST /organizations/:organizationId/restore` - Restore organization
- `POST /organizations/:organizationId/transfer-ownership` - Transfer ownership
- `GET /organizations/:organizationId/members` - List members

### Memberships (5 endpoints)
- `POST /organizations/:organizationId/members` - Add member
- `POST /organizations/:organizationId/accept` - Accept invitation
- `PUT /organizations/:organizationId/members/:userId/role` - Update member role
- `DELETE /organizations/:organizationId/members/:userId` - Remove member
- `DELETE /organizations/:organizationId/members/me` - Leave organization

### Health
- `GET /health` - Health check endpoint (built-in)

## API Reference

### `buildEdgeFunction(handlers, authService, options)`

Creates a Deno.serve() compatible handler function.

**Parameters:**
- `handlers` - Array of HandlerPackages from `@multitenantkit/api-handlers`
- `authService` - AuthService implementation (e.g., SupabaseAuthService)
- `options` - Configuration options

**Returns:** `(request: Request) => Promise<Response>`

### `EdgeRouter`

Low-level router class for advanced use cases.

```typescript
import { EdgeRouter } from '@multitenantkit/adapter-transport-supabase-edge';

const router = new EdgeRouter('/api', handlers);
const match = router.match('GET', '/api/users/me');
```

### Middleware Utilities

For custom implementations:

```typescript
import {
    authenticateRequest,
    buildCorsHeaders,
    handleCorsPreflightRequest,
    getRequestId,
    validateRequest
} from '@multitenantkit/adapter-transport-supabase-edge';
```

## Differences from Express Adapter

| Aspect | Express | Supabase Edge |
|--------|---------|---------------|
| Runtime | Node.js | Deno |
| Deploy | Manual | Automatic (Supabase) |
| Scaling | Manual | Automatic (edge) |
| CORS | `cors` middleware | Manual headers |
| Body parsing | `express.json()` | Native `request.json()` |
| Path params | Express router | Regex matching |

## License

MIT
