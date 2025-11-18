# @multitenantkit/sdk

Complete SDK for building multi-tenant SaaS backends - includes all adapters and options.

## 📦 What's Included

This SDK bundles all available packages from the MultiTenantKit:

### Core

- `@multitenantkit/domain-contracts` - Domain schemas and types
- `@multitenantkit/api-contracts` - API HTTP schemas
- `@multitenantkit/domain` - Business logic and use cases
- `@multitenantkit/composition` - Dependency injection and orchestration

### Persistence Adapters

- `@multitenantkit/adapter-persistence-json` - JSON file persistence (development)
- `@multitenantkit/adapter-persistence-postgres` - PostgreSQL persistence (production)

### Authentication

- `@multitenantkit/adapter-auth-supabase` - Supabase authentication

### API Layer

- `@multitenantkit/api-handlers` - Transport-agnostic HTTP handlers
- `@multitenantkit/adapter-transport-express` - Express.js adapter

### System Adapters

- `@multitenantkit/adapter-system-crypto-uuid` - UUID generator
- `@multitenantkit/adapter-system-system-clock` - System clock
- `@multitenantkit/adapter-metrics-http` - HTTP metrics and observability

## 🚀 Installation

### From Local Tarballs

When installing from local development, you need to install ALL the tarballs at once:

```bash
# Generate all tarballs
npm run pack

# Install all packages together
cd /path/to/your/project
npm install /path/to/multitenantkit/dist-packages/*.tgz
```

**Important:** The SDK requires all its peer dependencies to be installed. Installing only the SDK tarball will not work.

### From npm Registry

```bash
npm install @multitenantkit/sdk
```

## 📖 Usage

### Quick Start (Recommended)

The fastest way to get started with the most common stack (PostgreSQL + Supabase + Express):

```typescript
import { createExpressApp } from '@multitenantkit/sdk';

// One line to create a fully configured API
const app = createExpressApp();

app.listen(3000);
```

With custom fields:

```typescript
import { createExpressApp } from '@multitenantkit/sdk';
import { z } from 'zod';

const app = createExpressApp({
  namingStrategy: 'snake_case',
  users: {
    customFields: {
      customSchema: z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email()
      })
    }
  }
});

app.listen(3000);
```

Integrate into existing Express app:

```typescript
import express from 'express';
import { createExpressRouter } from '@multitenantkit/sdk';

const app = express();
app.get('/api/billing', billingHandler);

const router = createExpressRouter();
app.use('/api/teams', router);

app.listen(3000);
```

### Advanced Usage

For more control, use the individual functions:

```typescript
import {
  compose,
  buildHandlers,
  AdapterAuthSupabase,
  AdapterTransportExpress
} from '@multitenantkit/sdk';

// 1. Compose use cases
const { useCases } = compose(envOverrides, toolkitOptions);

// 2. Build handlers
const handlers = buildHandlers(useCases, toolkitOptions);

// 3. Create auth service
const authService = AdapterAuthSupabase.createSupabaseAuthService();

// 4. Create Express app
const app = AdapterTransportExpress.buildExpressApp(handlers, authService);

app.listen(3000);
```

### Direct Access to Components

This SDK gives you access to all adapters and options through convenient exports:

```typescript
// Import domain entities and use cases directly
import { User, CreateUser, Organization } from '@multitenantkit/sdk';

// Import contracts and types directly
import { ToolkitOptions, UserSchema, OrganizationSchema } from '@multitenantkit/sdk';

// Import API schemas
import { CreateUserRequestSchema, OrganizationResponseSchema } from '@multitenantkit/sdk';

// Import handlers
import { createUserHandler, getOrganizationHandler } from '@multitenantkit/sdk';

// Import adapters using namespaces (to avoid conflicts)
import {
  AdapterPersistenceJson,
  AdapterPersistencePostgres,
  AdapterTransportExpress,
  AdapterAuthSupabase
} from '@multitenantkit/sdk';

// Use JSON adapter for development
const userRepo = new AdapterPersistenceJson.JsonUserRepository(/* ... */);

// Or PostgreSQL for production
const repos = AdapterPersistencePostgres.createPostgresRepositories(/* ... */);

// Express server setup
const app = AdapterTransportExpress.buildExpressApp(/* ... */);
```

### Import Patterns

**Direct imports** (domain, contracts, handlers):

```typescript
import {
    User, // Domain entity
    CreateUser, // Use case
    ToolkitOptions, // Contract type
    UserSchema // Schema
} from '@multitenantkit/sdk';
```

**Namespace imports** (adapters):

```typescript
import { JsonAdapter, PostgresAdapter } from '@multitenantkit/sdk';

// Then use:
const repo = new JsonAdapter.JsonUserRepository(/* ... */);
```

## 🎯 When to Use

### ✅ Good for:

- **Development**: Experiment with different adapters
- **Testing**: Have all options available
- **Evaluation**: Try the SDK before committing
- **Monorepo apps**: When bundle size isn't critical
- **Prototyping**: Quick setup with all features

### ⚠️ Consider alternatives for:

- **Production deployments**: Use specific bundles or individual packages
- **Bundle size optimization**: Install only what you need
- **Microservices**: Use specific packages per service

## 📚 Alternative Packages

- **`@multitenantkit/express-starter`**: Production-ready Express setup with PostgreSQL (coming soon)
- **Individual packages**: Maximum control, smallest bundle size

## 🏗️ Architecture

Built with Clean Architecture and Hexagonal Architecture principles:

- **Domain-centric**: Business logic is independent
- **Pluggable adapters**: Swap implementations easily
- **Schema-first**: Single source of truth for contracts
- **Type-safe**: Full TypeScript support

## 📖 Documentation

- [Main Documentation](https://github.com/multitenantkit/multitenantkit)
- [Getting Started Guide](https://github.com/multitenantkit/multitenantkit/docs/getting-started.md)
- [API Reference](https://github.com/multitenantkit/multitenantkit/docs/api-reference.md)
- [Architecture Guide](https://github.com/multitenantkit/multitenantkit/docs/architecture.md)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](https://github.com/multitenantkit/multitenantkit/CONTRIBUTING.md)
