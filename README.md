# MultiTenantKit

**Stop building user and team management from scratch. Start shipping features.**

MultiTenantKit is a production-ready TypeScript toolkit that provides the **business logic** for managing users, organizations, and team memberships in your B2B SaaS. You keep control of your database, auth provider, and infrastructure—we handle the complex logic.

```bash
npm install @multitenantkit/sdk
```

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why MultiTenantKit?

Every B2B SaaS needs the same foundation:
- ✅ User profiles and lifecycle management
- ✅ Organizations/teams with ownership
- ✅ Role-based memberships (owner, admin, member)
- ✅ Invitation flows and access control

**You've built this before. So have we. Let's not do it again.**

MultiTenantKit gives you battle-tested business logic in minutes—not weeks. **Your database. Your auth. Your infrastructure.** We just provide the code that makes it all work together.

---

## Quick Start

### Get a REST API running in 30 seconds

```typescript
import { createExpressApp } from '@multitenantkit/sdk';

// One line to get your API ready
const app = createExpressApp();

app.listen(3000);
```

**That's it.** You now have a fully functional API with 18 endpoints for managing users, organizations, and memberships.

Want custom fields? Still just a few lines:

```typescript
import { createExpressApp } from '@multitenantkit/sdk';
import { z } from 'zod';

const app = createExpressApp({
  namingStrategy: 'snake_case', // Auto-convert firstName ↔ first_name
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

### Integrate into Existing Apps

Already have an Express app? Just mount the router:

```typescript
import express from 'express';
import { createExpressRouter } from '@multitenantkit/sdk';

const app = express();

// Your existing routes
app.get('/api/billing', billingHandler);

// Add MultiTenantKit under /api/teams
const router = createExpressRouter();
app.use('/api/teams', router);

app.listen(3000);
```

> 💡 **Need more control?** Use the individual functions (`compose`, `buildHandlers`, `buildExpressApp`) for full flexibility. The convenience functions are shortcuts for the most common stack (PostgreSQL + Supabase + Express).

### Database Setup

MultiTenantKit needs storage for **three entities**: Users, Organizations, and Memberships. The beauty? **You choose the table names and column names.**

```bash
# Verify your database schema matches your configuration
$ npx mtk validate
✓ All tables configured correctly
```

- **Starting fresh?** Use our [SQL schemas](./packages/adapters/persistence/postgres/sql/) for PostgreSQL
- **Using Supabase?** Use `auth.users` directly with columnMapping
- **Have existing tables?** Map them with `columnMapping` and `namingStrategy`

**No migration required.** MultiTenantKit adapts to your schema, not the other way around.

### Available Endpoints

```
Users (5 endpoints)
  POST   /users                       # Create User
  GET    /users/me                    # Get User
  PATCH  /users/me                    # Update User
  DELETE /users/me                    # Delete User
  GET    /users/me/organizations      # List User Organizations

Organizations (8 endpoints)
  POST   /organizations                                   # Create Organization
  GET    /organizations/:id                               # Get Organization
  PATCH  /organizations/:id/name                          # Update Organization
  DELETE /organizations/:organizationId                   # Delete Organization
  POST   /organizations/:organizationId/archive           # Archive Organization
  POST   /organizations/:organizationId/restore           # Restore Organization
  POST   /organizations/:organizationId/transfer-ownership # Transfer Organization Ownership
  GET    /organizations/:organizationId/members           # List Organization Members

Memberships (5 endpoints)
  POST   /organizations/:organizationId/members                # Add Organization Member
  POST   /organizations/:organizationId/accept                 # Accept Organization Invitation
  PUT    /organizations/:organizationId/members/:userId/role   # Update Organization Member Role
  DELETE /organizations/:organizationId/members/:userId        # Remove Organization Member
  DELETE /organizations/:organizationId/members/me             # Leave Organization
```

---

## Your Data, Your Infrastructure

**MultiTenantKit is not a service. It's a toolkit.**

Unlike SaaS solutions that lock your data in their platform, MultiTenantKit runs in **your codebase**, on **your infrastructure**:

- 🗄️ **Your Database** - PostgreSQL, MySQL, MongoDB, or any database you want. Build adapters for your persistence layer.
- 🔐 **Your Auth Provider** - Supabase, Auth0, Cognito, or any provider you choose. Implement the simple interface.
- 🚀 **Your Deployment** - AWS, GCP, Azure, Vercel, or wherever you want. It's just TypeScript code.
- 🔧 **Your Modifications** - Fork it, customize it, extend it—it's your code now.

We provide the **business logic and patterns**. You provide the infrastructure. This means:
- ✅ No vendor lock-in
- ✅ Complete data ownership
- ✅ Deploy anywhere
- ✅ Integrate with existing projects
- ✅ Customize without limits

---

## The Power: Customize Everything

MultiTenantKit is **easy by default, flexible when you need it**.

### Add Custom Fields (Type-Safe)

Extend any entity with your business-specific fields:

```typescript
import { z } from 'zod';

// Define your custom fields
const customUserFields = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional()
});

const customOrgFields = z.object({
  companyName: z.string(),
  industry: z.string(),
  plan: z.enum(['free', 'pro', 'enterprise'])
});

type CustomUser = z.infer<typeof customUserFields>;
type CustomOrg = z.infer<typeof customOrgFields>;

// Wire it up
const config = {
  users: {
    customFields: {
      customSchema: customUserFields,
      namingStrategy: 'snake_case'  // Maps to your existing DB
    }
  },
  organizations: {
    customFields: {
      customSchema: customOrgFields,
      namingStrategy: 'snake_case'
    }
  }
};

const useCases = createUseCases(adapters, config);
```

Now your API automatically validates and serves your custom fields—fully typed end-to-end.

### Hook Into the Lifecycle

Want to send welcome emails? Track analytics? Rate limit? Add custom validation?

```typescript
const config = {
  useCaseHooks: {
    CreateUser: {
      afterExecution: async ({ output }) => {
        // Send welcome email after user is created
        await emailService.sendWelcome(output.email);
      }
    },
    GetOrganization: {
      onStart: async ({ context }) => {
        // Rate limiting
        await rateLimiter.check(context.actorUserId);
      }
    },
    AddOrganizationMember: {
      afterValidation: async ({ validatedInput }) => {
        // Custom business rules
        if (await isBlacklisted(validatedInput.userId)) {
          throw new Error('User is not allowed');
        }
      }
    }
  }
};
```

### Transform Responses

Need to modify API responses without touching core logic?

```typescript
const config = {
  responseTransformers: {
    users: {
      GetUser: async ({ response, context }) => {
        // Add computed fields, filter sensitive data, etc.
        response.body.data.displayName =
          `${response.body.data.firstName} ${response.body.data.lastName}`;
        return response;
      }
    }
  }
};
```

---

## Add to Existing Projects

**Already have an application?** MultiTenantKit integrates seamlessly:

```typescript
import express from 'express';
import { createUseCases, buildHandlers, /* ... */ } from '@multitenantkit/sdk';

const app = express();

// Your existing routes
app.get('/api/billing', billingHandler);
app.post('/api/analytics', analyticsHandler);

// Add MultiTenantKit under a prefix
const useCases = createUseCases(adapters, config);
const handlers = buildHandlers(useCases, config);
const authService = createAuthService();
const mtRouter = buildExpressRouter(handlers, authService);

app.use('/api/teams', mtRouter);  // ← All team management under /api/teams

app.listen(3000);
```

Now you have 18 new endpoints under `/api/teams` without touching your existing code. Use your current database, your current auth—just add the functionality.

> 💡 Using a different framework? The handlers are framework-agnostic. Build a simple adapter for Hono, Fastify, Lambda, or your framework of choice.

---

## What's Included

### 🎯 Complete Business Logic (The Hard Part)
- **18 production-ready use cases** for users, organizations, and memberships
- Role-based access control (owner, admin, member)
- Soft deletes and restore functionality
- Automatic audit trails (createdAt, updatedAt)
- **Pure TypeScript code** that runs in your application

### 🔌 Adapters for Your Infrastructure
- **Persistence**: PostgreSQL (included) + JSON (dev/testing). Build adapters for MySQL, MongoDB, DynamoDB, etc.
- **Authentication**: Supabase Auth (included). Build adapters for Auth0, Cognito, Firebase, custom JWT, etc.
- **Transport**: Express.js (included). Build adapters for Hono, Fastify, AWS Lambda, etc.
- **Extensible by design**: Clear interfaces make building custom adapters straightforward

### 🛡️ Type Safety Everywhere
- Zod schemas for runtime validation
- Full TypeScript inference from database to API
- Single source of truth for all types

### 🏗️ Clean Architecture
- Hexagonal architecture (ports & adapters)
- **Business logic independent of infrastructure**
- Dependency injection out of the box
- Easily testable (all use cases unit tested)

### 📦 True Ownership & Flexibility
- Install as an npm package in **your** codebase
- Use the full stack or cherry-pick use cases
- Swap any adapter for your own implementation
- Works with existing applications (Express, Lambda, or build your own adapter)
- Database-agnostic domain logic
- **No external services, no recurring fees**

---

## Use Cases

### Perfect for:
- 🚀 **B2B SaaS startups** that need team management fast
- 🏢 **Enterprise apps** with multi-tenant requirements
- 🔧 **Solo developers** tired of rebuilding the same foundation
- 🎯 **Teams migrating** from monolith to microservices

### Works with:
- **Any web framework** - Express (included), Hono, Fastify, or AWS Lambda. Build adapters for your transport layer.
- **Existing applications** - Just mount the router, use your current setup
- **Greenfield projects** - Get started in minutes with sensible defaults
- **Your existing database** - Map your schema with `columnMapping` and `namingStrategy`
- **Any auth provider** - Supabase, Auth0, Cognito, or implement the `AuthService` interface
- **Your deployment** - AWS, GCP, Azure, Vercel, or self-hosted

---

## Configuration Options

MultiTenantKit is designed to adapt to **your** database and requirements:

| Feature | Description |
|---------|-------------|
| **Custom Fields** | Extend users, organizations, memberships with Zod schemas |
| **Column Mapping** | Rename base fields to match your existing DB (`externalId` → `auth_id`) |
| **Naming Strategies** | Auto-convert field names (`camelCase` ↔ `snake_case`, `kebab-case`, `PascalCase`) |
| **Custom Mappers** | Complex transformations for denormalized or legacy schemas |
| **Use Case Hooks** | Inject logic at 7 lifecycle points + abort mechanism (onStart, afterValidation, beforeExecution, afterExecution, onError, onAbort, onFinally) |
| **Response Transformers** | Modify HTTP responses without touching domain logic |
| **Database Schemas** | Configure schema names, table names per entity |

---

## Package Structure

MultiTenantKit is a monorepo with composable packages:

```
@multitenantkit/
├── sdk                          # 📦 All-in-one bundle (recommended)
├── domain                       # Pure business logic
├── domain-contracts             # Domain interfaces and schemas
├── api-contracts                # HTTP request/response schemas
├── api-handlers                 # Framework-agnostic HTTP handlers
├── composition                  # Dependency injection
└── adapters/
    ├── persistence/
    │   ├── postgres             # PostgreSQL implementation
    │   └── json                 # JSON file storage (dev/test)
    ├── auth/
    │   └── supabase             # Supabase Auth adapter
    ├── transport/
    │   └── express              # Express.js adapter
    └── system/
        ├── crypto-uuid          # UUID generation
        └── system-clock         # Time operations
```

**Recommended**: Use `@multitenantkit/sdk` for the complete experience.

**Advanced**: Install individual packages for granular control.

---

## Documentation

- **[Getting Started](./docs/getting-started.md)** - Your first app in 5 minutes
- **[Custom Fields Guide](./docs/custom-fields.md)** - Extend entities with your data
- **[Adapters](./docs/adapters.md)** - Build custom persistence, auth, or transport layers
- **[Architecture](./docs/architecture.md)** - Deep dive into the design
- **[API Reference](./docs/api-reference.md)** - Complete API documentation
- **[Examples](./examples)** - Real-world code samples

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Authentication (Supabase example)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server (optional)
PORT=3000
NODE_ENV=production
```

---

## Roadmap

We're actively developing:

- 🔐 **More auth adapters** (Auth0, AWS Cognito, Firebase, Custom JWT)
- 📧 **Invitation flows** (email invitations with pending state)
- 🪝 **Webhooks** (subscribe to domain events)
- 📊 **Audit logging** (comprehensive activity trails)
- 💳 **Billing integration** (connect teams to Stripe subscriptions)
- 🌍 **i18n support** (internationalization)
- ⚡ **Lambda adapter** (serverless deployments)

---

## Contributing

Contributions are welcome! This toolkit is built to be:
- **Extended**: Add new adapters, use cases, or features
- **Fixed**: Found a bug? PRs appreciated
- **Improved**: Better docs, examples, or DX enhancements

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Philosophy

MultiTenantKit is built on four core principles:

1. **You own everything** - Your code, your data, your infrastructure. We're a library, not a service.
2. **Ease first, power when needed** - Simple things should be simple, complex things should be possible.
3. **Type safety everywhere** - Runtime validation with compile-time guarantees.
4. **Zero lock-in** - Every piece is replaceable. Use what you need, replace what you don't.

We believe developers should spend time on their unique value proposition, not rebuilding user management for the 10th time. MultiTenantKit gives you the building blocks—you decide how to use them.

---

## License

MIT © [MultiTenantKit](https://github.com/multitenantkit/multitenantkit)

---

## Support

- 📖 **Documentation**: [docs.multitenantkit.dev](https://docs.multitenantkit.dev) *(coming soon)*
- 💬 **Discord**: [Join our community](https://discord.gg/multitenantkit) *(coming soon)*
- 🐛 **Issues**: [GitHub Issues](https://github.com/multitenantkit/multitenantkit/issues)
- 📧 **Email**: support@multitenantkit.dev *(coming soon)*

---

<p align="center">
  <strong>Stop rebuilding. Start shipping.</strong>
  <br />
  <a href="#quick-start">Get Started →</a>
</p>
