# multitenantkit/adapter-system-system-clock

System adapter that implements clock functionality using real system time.

## Overview

This package provides a concrete implementation of the `ClockPort` interface from `multitenantkit/domain-contracts`, using JavaScript's built-in `Date` object.

## Installation

This package is part of the MultiTenantKit monorepo and is installed automatically via workspace dependencies.

## Usage

```typescript
import { SystemClock } from '@multitenantkit/adapter-system-system-clock';

const clock = new SystemClock();
const currentTime = clock.now(); // Returns current Date
```

## Architecture

This adapter follows the **Hexagonal Architecture** (Ports & Adapters) pattern:

- **Port**: `ClockPort` interface defined in `multitenantkit/domain-contracts`
- **Adapter**: `SystemClock` class that implements the port using JavaScript Date

## Features

- ✅ Real system time using `new Date()`
- ✅ Type-safe implementation of `ClockPort`
- ✅ Zero external dependencies (uses JavaScript built-in Date)
- ✅ Suitable for production use

## Why Separate Package?

This adapter is extracted into its own package to:

1. **Separation of Concerns**: System utilities are independent from persistence logic
2. **Reusability**: Can be used by any adapter (JSON, Postgres, etc.) without coupling
3. **Testability**: Easy to mock with fixed time for deterministic tests
4. **Clean Architecture**: Respects dependency inversion principle

## Testing

For testing purposes, you can easily create a mock clock:

```typescript
class MockClock implements ClockPort {
    constructor(private fixedTime: Date) {}

    now(): Date {
        return this.fixedTime;
    }
}

// Use in tests
const fixedDate = new Date('2024-01-01T00:00:00Z');
const mockClock = new MockClock(fixedDate);
```

## Related Packages

- `multitenantkit/domain-contracts` - Defines the `ClockPort` interface
- `multitenantkit/adapter-system-crypto-uuid` - UUID generation adapter
