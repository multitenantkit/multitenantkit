# Contributing to MultiTenantKit

Thank you for your interest in contributing to MultiTenantKit! We welcome contributions from the community, whether it's bug fixes, new features, documentation improvements, or new adapters.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Creating New Adapters](#creating-new-adapters)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

Before you begin:
- Ensure you have [Node.js](https://nodejs.org/) (v20 or higher) installed
- Familiarize yourself with the [project documentation](./README.md)
- Read the [online documentation](https://multitenantkit.dev) to understand the architecture and design principles

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/multitenantkit.git
cd multitenantkit

# Add upstream remote
git remote add upstream https://github.com/multitenantkit/multitenantkit.git
```

### 2. Install Dependencies

```bash
# Install all dependencies for the monorepo
npm install
```

### 3. Build All Packages

```bash
# Build all packages
npm run build

# Or build a specific package
npm run build -w @multitenantkit/domain
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```



## Project Structure

MultiTenantKit is organized as a monorepo following Hexagonal Architecture (Ports & Adapters):

```
packages/
├── contracts/              # Port definitions & schemas
│   ├── domain-contracts    # Domain entities, use case interfaces, repository ports
│   └── api-contracts       # HTTP API request/response schemas
├── domain/                 # Pure business logic (use cases)
├── adapters/               # Infrastructure implementations
│   ├── persistence/        # Data storage adapters
│   │   ├── json            # JSON file storage (dev/test)
│   │   └── postgres        # PostgreSQL implementation
│   ├── auth/               # Authentication adapters
│   │   └── supabase        # Supabase Auth integration
│   ├── transport/          # API delivery mechanisms
│   │   └── express         # Express.js adapter
│   └── system/             # System utilities
│       ├── crypto-uuid     # UUID generation
│       └── system-clock    # Time operations
├── api/                    # Transport layer
│   └── handlers            # HTTP request handlers
├── composition/            # Dependency injection & bootstrapping
└── bundles/                # Distribution packages
    └── sdk                 # Complete SDK with all adapters
```

### Key Principles

1. **Domain-Centric**: Business logic is isolated from infrastructure
2. **Dependency Inversion**: Infrastructure depends on domain, never vice versa
3. **Ports & Adapters**: All external interactions go through well-defined interfaces
4. **Type Safety**: Zod schemas provide runtime validation and TypeScript type inference
5. **Composability**: Applications are assembled via Dependency Injection

## How to Contribute

### Reporting Bugs

Before creating bug reports:
- Check the [issue tracker](https://github.com/multitenantkit/multitenantkit/issues) for existing reports
- Ensure you're using the latest version

When reporting bugs, include:
- Clear, descriptive title
- Steps to reproduce
- Expected vs. actual behavior
- Code samples or error messages
- Your environment (Node version, OS, database, etc.)

### Suggesting Features

We welcome feature suggestions! Please:
- Check if the feature has already been suggested
- Clearly describe the use case and benefit
- Consider how it fits with the project's architecture
- Be open to discussion and iteration

### Pull Requests

1. **Discuss First**: For major changes, open an issue first to discuss the approach
2. **Create a Branch**: Use descriptive branch names (`feature/add-mysql-adapter`, `fix/user-validation-bug`)
3. **Follow Code Standards**: Ensure your code follows our style guide (see below)
4. **Write Tests**: Add tests for new functionality
5. **Update Documentation**: Update relevant docs and comments
6. **Keep It Focused**: One feature/fix per PR

## Creating New Adapters

One of the most valuable contributions is creating new adapters for different technologies. MultiTenantKit is designed to be extensible through adapters.

### Types of Adapters

#### 1. Persistence Adapters

Implement repository interfaces for different databases.

**Location**: `packages/adapters/persistence/YOUR_ADAPTER/`

**Interfaces to Implement**:
- `UserRepository<TCustomFields>`
- `OrganizationRepository<TCustomFields>`
- `OrganizationMembershipRepository<TCustomFields>`
- `UnitOfWork`

**Example**: Creating a MySQL adapter

```typescript
// packages/adapters/persistence/mysql/src/repositories/MysqlUserRepository.ts
import type { UserRepository, User } from '@multitenantkit/domain-contracts';

export class MysqlUserRepository<TCustomFields> implements UserRepository<TCustomFields> {
    constructor(
        private readonly client: MySQLClient,
        private readonly config?: UserEntityConfig<TCustomFields>
    ) {}

    async findById(id: string): Promise<User<TCustomFields> | null> {
        // Your MySQL implementation
        const row = await this.client.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );

        if (!row) return null;

        return this.mapToEntity(row);
    }

    async insert(user: User<TCustomFields>, context?: OperationContext): Promise<void> {
        // Your MySQL implementation
    }

    // Implement other methods...
}
```

**Required Files**:
```
packages/adapters/persistence/mysql/
├── src/
│   ├── index.ts                    # Public exports
│   ├── MysqlClient.ts              # Database client wrapper
│   ├── repositories/
│   │   ├── MysqlUserRepository.ts
│   │   ├── MysqlOrganizationRepository.ts
│   │   └── MysqlOrganizationMembershipRepository.ts
│   └── MysqlUnitOfWork.ts          # Transaction management
├── __tests__/
│   └── MysqlUserRepository.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

#### 2. Authentication Adapters

Implement the `AuthService` interface for different auth providers.

**Location**: `packages/adapters/auth/YOUR_ADAPTER/`

**Interface to Implement**: `AuthService`

**Example**: Creating an Auth0 adapter

```typescript
// packages/adapters/auth/auth0/src/Auth0AuthService.ts
import type { AuthService, Principal } from '@multitenantkit/api-contracts';
import { verify } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export function createAuth0AuthService(config: Auth0Config): AuthService {
    const client = jwksClient({
        jwksUri: `https://${config.domain}/.well-known/jwks.json`
    });

    return {
        async extractPrincipal(token: string): Promise<Principal | null> {
            try {
                // Verify JWT with Auth0
                const decoded = await verify(token, getKey, {
                    audience: config.audience,
                    issuer: `https://${config.domain}/`
                });

                return {
                    authProviderId: decoded.sub,
                    email: decoded.email,
                    role: decoded.role
                };
            } catch (error) {
                return null;
            }
        }
    };
}
```

**Required Files**:
```
packages/adapters/auth/auth0/
├── src/
│   ├── index.ts              # Public exports
│   └── Auth0AuthService.ts   # Implementation
├── __tests__/
│   └── Auth0AuthService.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

#### 3. Transport Adapters

Implement delivery mechanism for different web frameworks.

**Location**: `packages/adapters/transport/YOUR_ADAPTER/`

**Example**: Creating a Fastify adapter

```typescript
// packages/adapters/transport/fastify/src/buildFastifyApp.ts
import type { FastifyInstance } from 'fastify';
import type { HandlerPackage } from '@multitenantkit/api-handlers';
import type { AuthService } from '@multitenantkit/api-contracts';

export function buildFastifyApp(
    handlerPackages: HandlerPackage[],
    authService: AuthService
): FastifyInstance {
    const app = fastify();

    // Register middleware
    app.register(helmet);
    app.register(cors);

    // Health check
    app.get('/health', async () => ({ status: 'ok' }));

    // Register handlers
    for (const pkg of handlerPackages) {
        const method = pkg.route.method.toLowerCase();

        app[method](pkg.route.path, async (request, reply) => {
            // Extract auth
            const principal = pkg.route.requiresAuth
                ? await authService.extractPrincipal(request.headers.authorization)
                : null;

            // Execute handler
            const result = await pkg.handler({
                input: { /* ... */ },
                principal,
                requestId: /* ... */
            });

            return reply.status(result.status).send(result.body);
        });
    }

    return app;
}
```

**Required Files**:
```
packages/adapters/transport/fastify/
├── src/
│   ├── index.ts                # Public exports
│   ├── buildFastifyApp.ts      # Main app builder
│   └── middleware/             # Fastify-specific middleware
├── __tests__/
│   └── buildFastifyApp.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Adapter Checklist

When creating a new adapter:

- [ ] Create the package directory structure
- [ ] Implement all required interfaces from contracts
- [ ] Add comprehensive unit tests (aim for 80%+ coverage)
- [ ] Add integration tests if applicable
- [ ] Create a detailed README with:
  - Installation instructions
  - Configuration options
  - Usage examples
  - Limitations or known issues
- [ ] Add TypeScript types and ensure full type safety
- [ ] Add to the main SDK exports (if appropriate)
- [ ] Update root README with the new adapter
- [ ] Add example usage in documentation

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create a new branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write your code
- Follow the code standards (see below)
- Add tests
- Update documentation

### 3. Test Your Changes

```bash
# Run linting
npm run check

# Run tests
npm test

# Run tests for specific package
npm run test -w @multitenantkit/YOUR_PACKAGE
```

### 4. Commit Your Changes

We use conventional commits:

```bash
git commit -m "feat: add MySQL adapter for persistence"
git commit -m "fix: correct validation in CreateUser use case"
git commit -m "docs: update adapter creation guide"
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build process, tooling, dependencies

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Standards

### TypeScript Guidelines

- **Use TypeScript strict mode**: All code must compile with strict TypeScript checks
- **Prefer interfaces for contracts**: Use `interface` for ports, `type` for unions/intersections
- **Use const assertions**: For constant objects that shouldn't change
- **Avoid `any`**: Use `unknown` if you truly don't know the type
- **Use generics wisely**: Especially for custom fields support

### Code Style

We use **Biome** for linting and formatting.

**Important**: When contributing to a specific adapter, run checks **only within that adapter's directory** and ensure they pass **only for files in your PR** (files you've created or modified). You don't need to fix issues in files you haven't touched.

```bash
# Navigate to your adapter directory
cd packages/adapters/persistence/your-adapter

# Check code style for your changes
npm run check

# Auto-fix issues in your changes
npm run fix:safe

# Auto-fix all issues (including unsafe)
npm run fix:all
```

### Naming Conventions

- **Files**: `PascalCase.ts` for classes, `camelCase.ts` for functions/utilities
- **Folders**: `kebab-case` (e.g., `create-user`, `postgres-adapter`)
- **Classes**: `PascalCase` (e.g., `CreateUser`, `PostgresUserRepository`)
- **Interfaces**: `PascalCase` (e.g., `UserRepository`, `AuthService`)
- **Functions**: `camelCase` (e.g., `createUseCases`, `buildHandlers`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PAGE_SIZE`)
- **Types**: `PascalCase` (e.g., `User`, `Organization`)

### Comments and Documentation

- **Code comments in English**: All code and inline comments must be in English
- **Use JSDoc**: For public APIs and complex functions
- **Explain "why", not "what"**: Code should be self-explanatory; comments explain reasoning
- **TODO comments**: Use `// TODO: description` for future improvements

Example:

```typescript
/**
 * Creates a new user in the system.
 *
 * @param input - User creation input data
 * @param context - Operation context with actor information
 * @returns Result containing the created user or error
 *
 * @example
 * ```typescript
 * const result = await createUser.execute({
 *   externalId: 'auth-provider-id',
 *   email: 'user@example.com'
 * }, context);
 * ```
 */
async execute(
    input: CreateUserInput<TCustomFields>,
    context: OperationContext
): Promise<Result<User<TCustomFields>, DomainError>> {
    // Implementation
}
```

### Error Handling

- **Use the `Result` type**: For domain operations (Railway Oriented Programming)
- **Throw for programming errors**: Only throw for unexpected errors
- **Use domain errors**: Map infrastructure errors to domain error types

```typescript
// Good
const result = await userRepo.findById(userId);
if (!result) {
    return Result.fail(new NotFoundError('User not found'));
}

// Avoid
try {
    const user = await userRepo.findById(userId);
} catch (error) {
    // Don't use try-catch for expected domain errors
}
```

## Testing

### Test Structure

- **Unit Tests**: Test individual functions/classes in isolation
- **Integration Tests**: Test adapter implementations with real infrastructure
- **Handler Tests**: Test HTTP handlers with mock use cases

### Test Location

Tests should be colocated in `__tests__/` directories:

```
src/
├── CreateUser.ts
└── __tests__/
    └── CreateUser.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateUser } from '../CreateUser';

describe('CreateUser', () => {
    let useCase: CreateUser;
    let mockUserRepo: MockUserRepository;

    beforeEach(() => {
        mockUserRepo = new MockUserRepository();
        useCase = new CreateUser({ userRepository: mockUserRepo });
    });

    it('should create a user successfully', async () => {
        // Arrange
        const input = {
            externalId: 'ext-123',
            email: 'test@example.com'
        };

        // Act
        const result = await useCase.execute(input, createMockContext());

        // Assert
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().email).toBe('test@example.com');
    });

    it('should fail when email is invalid', async () => {
        // Arrange
        const input = {
            externalId: 'ext-123',
            email: 'invalid-email'
        };

        // Act
        const result = await useCase.execute(input, createMockContext());

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBeInstanceOf(ValidationError);
    });
});
```

### Test Coverage

- Aim for at least **80% code coverage** for new features
- Critical paths (use cases, repositories) should have **90%+ coverage**
- Run coverage report: `npm run test:coverage`

## Documentation

### README Files

Each package should have a README.md with:
- Purpose and functionality
- Installation instructions
- Usage examples
- API documentation
- Configuration options



### Code Examples

- Provide working examples in package READMEs
- Add examples to the `examples/` directory for complex use cases
- Ensure examples are tested and up-to-date

## Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Ensure all checks pass**:
   - Linting: `npm run check`
   - Tests: `npm test`
   - Type checking: `npm run type-check`
   - Build: `npm run build`

3. **Create a changeset** (for packages that will be published):
   ```bash
   npm run changeset
   ```
   Follow the prompts to describe your changes.

4. **Write a clear PR description**:
   - What problem does this solve?
   - What approach did you take?
   - Are there any breaking changes?
   - Screenshots (for UI changes)
   - Related issues (use `Closes #123`)

5. **Request review**: Tag relevant maintainers or wait for automatic assignment

### PR Title Format

Use conventional commit format:
- `feat: add MongoDB adapter`
- `fix: resolve race condition in UnitOfWork`
- `docs: improve adapter creation guide`

### Review Process

- Maintainers will review your PR within a few days
- Address feedback and push updates
- Once approved, a maintainer will merge your PR

## Release Process

We use **Changesets** for version management:

1. Contributors add changesets with their PRs
2. Maintainers use `npm run version` to bump versions
3. Maintainers use `npm run release` to publish to npm

You don't need to worry about versions—just add a changeset when prompted!

## Questions?

- **Documentation**: Check the [README](./README.md) and [architecture docs](./.idea/docs/ARCHITECTURE.md)
- **Issues**: Search [existing issues](https://github.com/multitenantkit/multitenantkit/issues)
- **Discussion**: Open a discussion on GitHub
- **Email**: support@multitenantkit.dev

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MultiTenantKit! 🎉
