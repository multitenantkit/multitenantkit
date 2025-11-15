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

This SDK gives you access to all adapters and options through convenient exports:

```typescript
// Import domain entities and use cases directly
import { User, CreateUser, Organization } from '@multitenantkit/sdk';

// Import contracts and types directly
import { FrameworkConfig, UserSchema, OrganizationSchema } from '@multitenantkit/sdk';

// Import API schemas
import { CreateUserRequestSchema, OrganizationResponseSchema } from '@multitenantkit/sdk';

// Import handlers
import { createUserHandler, getOrganizationHandler } from '@multitenantkit/sdk';

// Import adapters using namespaces (to avoid conflicts)
import { JsonAdapter, PostgresAdapter, ExpressAdapter, SupabaseAuth } from '@multitenantkit/sdk';

// Use JSON adapter for development
const userRepo = new JsonAdapter.JsonUserRepository(/* ... */);

// Or PostgreSQL for production
const userRepo = new PostgresAdapter.PostgresUserRepository(/* ... */);

// Express server setup
const app = ExpressAdapter.buildExpressApp(/* ... */);
```

### Import Patterns

**Direct imports** (domain, contracts, handlers):

```typescript
import {
    User, // Domain entity
    CreateUser, // Use case
    FrameworkConfig, // Contract type
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
