# multitenantkit/adapter-system-crypto-uuid

System adapter that implements UUID generation using Node.js crypto module.

## Overview

This package provides a concrete implementation of the `UuidPort` interface from `multitenantkit/domain-contracts`, using Node.js built-in `crypto.randomUUID()` function.

## Installation

This package is part of the MultiTenantKit monorepo and is installed automatically via workspace dependencies.

## Usage

```typescript
import { CryptoUuid } from '@multitenantkit/adapter-system-crypto-uuid';

const uuidGenerator = new CryptoUuid();
const newId = uuidGenerator.generate(); // Returns a UUID v4 string
```

## Architecture

This adapter follows the **Hexagonal Architecture** (Ports & Adapters) pattern:

- **Port**: `UuidPort` interface defined in `multitenantkit/domain-contracts`
- **Adapter**: `CryptoUuid` class that implements the port using Node.js crypto

## Features

- ✅ UUID v4 generation using `crypto.randomUUID()`
- ✅ Type-safe implementation of `UuidPort`
- ✅ Zero external dependencies (uses Node.js built-in crypto)
- ✅ Suitable for production use

## Why Separate Package?

This adapter is extracted into its own package to:

1. **Separation of Concerns**: System utilities are independent from persistence logic
2. **Reusability**: Can be used by any adapter (JSON, Postgres, etc.) without coupling
3. **Testability**: Easy to mock or replace with alternative implementations
4. **Clean Architecture**: Respects dependency inversion principle

## Related Packages

- `multitenantkit/domain-contracts` - Defines the `UuidPort` interface
- `multitenantkit/adapter-system-system-clock` - System clock adapter
