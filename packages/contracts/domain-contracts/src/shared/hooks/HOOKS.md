# Use Case Hooks System

## Overview

The Use Case Hooks System provides a powerful and flexible way to inject custom logic at specific points during use case execution. Hooks allow you to implement cross-cutting concerns like logging, metrics, rate limiting, custom validations, and side effects without modifying the core business logic.

## Key Features

- **✅ Full Adapter Access**: Hooks have direct access to all adapters (persistence, system, observability)
- **✅ Graceful Abort Mechanism**: Abort execution cleanly without throwing exceptions
- **✅ Immutable Input/Results**: Input and step results are readonly, preventing accidental mutations
- **✅ Shared State**: Mutable shared object for passing data between hooks
- **✅ Type-Safe**: Full TypeScript support with proper types for each use case
- **✅ Comprehensive Lifecycle**: 7 hook points covering the entire execution pipeline

---

## Hook Lifecycle

Hooks execute in the following order during a use case execution:

```
1. onStart              → Before input validation
                          ↓
2. afterValidation      → After successful validation
                          ↓
3. beforeExecution      → After authorization, before business logic
                          ↓
4. afterExecution       → After successful business logic
                          ↓
5. onError              → If an error occurs (alternative path)
   OR
   onAbort              → If abort() is called (alternative path)
                          ↓
6. onFinally            → Always executes (success, error, or abort)
```

---

## Hook Context API

Every hook receives a `HookContext` object with the following properties:

### Immutable Properties (Readonly)

#### `executionId: string`

Unique identifier for this specific use case execution. Useful for correlating logs and metrics.

```typescript
onStart: ({ executionId }) => {
    console.log(`Starting execution ${executionId}`);
};
```

#### `useCaseName: string`

Name of the use case being executed (format: `"entity-useCaseName"`).

```typescript
onFinally: ({ useCaseName, result }) => {
    metrics.record({ useCaseName, success: result.isSuccess });
};
```

#### `input: TInput`

The original raw input provided to the use case. This is immutable and cannot be modified by hooks.

```typescript
onStart: ({ input }) => {
    console.log('Processing input:', input);
    // input is readonly - cannot modify
};
```

#### `stepResults: object`

Results from previous pipeline steps. Available results depend on which hook is executing:

| Hook              | Available Results                          |
| ----------------- | ------------------------------------------ |
| `onStart`         | none                                       |
| `afterValidation` | `validatedInput`                           |
| `beforeExecution` | `validatedInput`, `authorized`             |
| `afterExecution`  | `validatedInput`, `authorized`, `output`   |
| `onError`         | varies (depends on where error occurred)   |
| `onAbort`         | varies (depends on where abort was called) |
| `onFinally`       | all available                              |

```typescript
afterValidation: ({ stepResults }) => {
    const validated = stepResults.validatedInput!;
    console.log('Validated input:', validated);
};

afterExecution: ({ stepResults }) => {
    const output = stepResults.output!;
    console.log('Business logic output:', output);
};
```

#### `context: OperationContext`

Operation context for audit logging. Contains information about who is performing the operation:

```typescript
interface OperationContext {
    requestId: string; // Unique request identifier
    actorUserId: string; // ID of the user performing the operation
    organizationId?: string; // Organization context (optional)
    metadata?: AuditMetadata; // Additional metadata (IP, user agent, etc.)
    auditAction?: string; // Specific business action
}
```

```typescript
beforeExecution: ({ context }) => {
    auditLog.record({
        requestId: context.requestId,
        userId: context.actorUserId,
        action: 'authorized'
    });
};
```

#### `adapters: Adapters`

Full access to all infrastructure adapters:

```typescript
interface Adapters {
    persistence: {
        uow: UnitOfWork;
        userRepository: UserRepository;
        organizationRepository: OrganizationRepository;
        organizationMembershipRepository: OrganizationMembershipRepository;
    };
    system: {
        clock: ClockPort;
        uuid: UuidPort;
    };
    observability?: {
        logHookExecution: (data: any) => Promise<void>;
    };
}
```

```typescript
afterValidation: async ({ stepResults, adapters }) => {
    // Use adapters to perform complex operations
    const user = await adapters.persistence.userRepository.findById(
        stepResults.validatedInput.userId
    );

    if (user.status === 'suspended') {
        throw new Error('User is suspended');
    }
};
```

### Mutable Properties

#### `shared: Record<string, any>`

Shared mutable state for passing data between hooks. This is the **only** mutable part of the context.

```typescript
onStart: ({ shared }) => {
    shared.startTime = Date.now();
    shared.userAgent = 'Mozilla/5.0...';
};

onFinally: ({ shared }) => {
    const duration = Date.now() - shared.startTime;
    console.log(`Execution took ${duration}ms`);
};
```

### Functions

#### `abort(reason: string): void`

Gracefully abort the use case execution without throwing an exception.

When called:

1. Stops the execution pipeline immediately
2. Triggers the `onAbort` hook (if configured)
3. Returns an `AbortedError` result

Unlike throwing an error (which triggers `onError`), abort provides a clean way to stop execution for non-error conditions.

```typescript
afterValidation: async ({ abort, stepResults, adapters }) => {
    // Rate limiting check
    const attempts = await rateLimiter.getAttempts(stepResults.validatedInput.userId);

    if (attempts > 5) {
        abort('Rate limit exceeded: too many requests');
        return; // abort() doesn't throw, so return to exit hook
    }
};
```

---

## Hook Definitions

### 1. onStart

**Executes**: Before input validation
**Available in context**: `input`, `adapters`, `shared`, `context`, `abort()`

**Use cases**:

- Initial logging and tracking
- Rate limiting checks
- Feature flag checks
- Circuit breaker checks
- Input enrichment preparation

**Example**:

```typescript
onStart: async ({ input, shared, adapters, abort, context }) => {
    // Track execution start time
    shared.startTime = Date.now();

    // Log start
    console.log(`[${context.requestId}] Starting use case`, input);

    // Rate limiting
    const attempts = await rateLimiter.getAttempts(context.actorUserId);
    if (attempts > 10) {
        abort('Rate limit exceeded');
    }

    // Feature flag check
    const featureEnabled = await featureFlags.isEnabled('new-feature');
    if (!featureEnabled) {
        abort('Feature is disabled');
    }
};
```

---

### 2. afterValidation

**Executes**: After input validation succeeds
**Available in context**: `input`, `stepResults.validatedInput`, `adapters`, `shared`, `context`, `abort()`

**Use cases**:

- Additional custom validations beyond schema
- Business rule checks
- Data enrichment post-validation
- Complex cross-field validations
- Checking resource existence

**Example**:

```typescript
afterValidation: async ({ stepResults, adapters, abort, shared }) => {
    const validated = stepResults.validatedInput!;

    // Custom validation: email domain check
    const emailDomain = validated.email.split('@')[1];
    const blockedDomains = ['spam.com', 'fake.com'];

    if (blockedDomains.includes(emailDomain)) {
        shared.blockedDomain = emailDomain;
        throw new ValidationError(`Domain ${emailDomain} is not allowed`);
    }

    // Check if user already exists
    const existingUser = await adapters.persistence.userRepository.findByEmail(validated.email);

    if (existingUser) {
        abort('User with this email already exists');
    }

    // Check quota
    const quota = await quotaService.getQuota(validated.userId);
    if (quota.exceeded) {
        abort('User quota exceeded');
    }
};
```

---

### 3. beforeExecution

**Executes**: After authorization succeeds, before business logic
**Available in context**: `input`, `stepResults.validatedInput`, `stepResults.authorized`, `adapters`, `shared`, `context`, `abort()`

**Use cases**:

- Logging successful authorization
- Recording audit information
- Pre-execution checks (quota, feature flags)
- Final validations before execution
- Preparing shared data for business logic

**Example**:

```typescript
beforeExecution: async ({ stepResults, context, adapters, shared, abort }) => {
    const validated = stepResults.validatedInput!;

    // Log authorization success for audit
    await auditLog.record({
        requestId: context.requestId,
        userId: context.actorUserId,
        action: 'authorized',
        resource: validated.organizationId
    });

    // Check user quota before execution
    const userQuota = await quotaService.getQuota(context.actorUserId);
    if (userQuota.exceeded) {
        shared.quotaExceeded = true;
        abort('User quota exceeded');
    }

    // Check if organization is active
    const org = await adapters.persistence.organizationRepository.findById(
        validated.organizationId
    );

    if (org?.status === 'suspended') {
        abort('Organization is suspended');
    }
};
```

---

### 4. afterExecution

**Executes**: After business logic executes successfully
**Available in context**: `input`, `stepResults.validatedInput`, `stepResults.output`, `adapters`, `shared`, `context`, `abort()`

**Use cases**:

- Side effects (send emails, notifications, webhooks)
- Output analysis
- Post-processing
- Triggering dependent workflows
- Updating caches

**Important**: If this hook throws an error, execution is aborted and `onError` is triggered. To prevent abortion on side effect failures, wrap in try/catch.

**Example**:

```typescript
afterExecution: async ({ stepResults, adapters, shared, context }) => {
    const output = stepResults.output!;

    // Side effect: send welcome email (don't abort on failure)
    try {
        await emailService.sendWelcome({
            to: output.email,
            name: output.name,
            userId: output.id
        });
        shared.emailSent = true;
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        shared.emailSent = false;
        // Error is caught, execution continues
    }

    // Trigger webhook (fire-and-forget)
    webhookService
        .trigger('user.created', output)
        .catch((err) => console.error('Webhook failed:', err));

    // Update cache
    try {
        await cache.set(`user:${output.id}`, output, 3600);
    } catch (error) {
        console.error('Cache update failed:', error);
    }

    // Record metric
    await adapters.observability?.logHookExecution({
        requestId: context.requestId,
        useCaseName: 'CreateUser',
        hookName: 'afterExecution',
        executionId: context.requestId,
        timestamp: new Date(),
        params: { userId: output.id, success: true }
    });
};
```

---

### 5. onError

**Executes**: When an error occurs in any step
**Available in context**: `input`, `stepResults` (partial), `adapters`, `shared`, `context`, **`error`**

**Use cases**:

- Error logging with context
- Error notifications
- Error recovery attempts
- Rollback operations
- Alert critical errors

**Important**: If this hook throws an error, it replaces the original error.

**Example**:

```typescript
onError: async ({ error, shared, context, adapters, stepResults }) => {
    // Log error with full context
    console.error('Use case failed', {
        useCaseName: context.useCaseName,
        executionId: context.executionId,
        requestId: context.requestId,
        error: error.message,
        errorCode: error.code,
        shared,
        stepResults
    });

    // Send alert for critical infrastructure errors
    if (error instanceof InfrastructureError) {
        await alertService.sendCriticalAlert({
            service: 'MultiTenantKit',
            error: error.message,
            context: context.requestId,
            severity: 'critical'
        });
    }

    // Record error metric
    await adapters.observability?.logHookExecution({
        requestId: context.requestId,
        useCaseName: context.useCaseName,
        hookName: 'onError',
        executionId: context.executionId,
        timestamp: new Date(),
        params: { error: error.message, code: error.code }
    });

    // Attempt recovery for specific errors
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
        // Don't alert for rate limit errors
        return;
    }
};
```

---

### 6. onAbort

**Executes**: When execution is gracefully aborted via `abort()`
**Available in context**: `input`, `stepResults` (partial), `adapters`, `shared`, `context`, **`reason`**

**Use cases**:

- Log abort reason
- Record metrics for aborted operations
- Clean up resources
- Notify monitoring systems
- Different handling than errors (e.g., no alerts for rate limits)

**Important**: Errors thrown in this hook are caught and logged but don't affect the abort result.

**Example**:

```typescript
onAbort: async ({ reason, shared, context, adapters, stepResults }) => {
    // Log abort with context
    console.log('Use case aborted', {
        useCaseName: context.useCaseName,
        executionId: context.executionId,
        requestId: context.requestId,
        reason,
        duration: Date.now() - shared.startTime,
        stepResults
    });

    // Record metrics (different from errors)
    await adapters.observability?.logHookExecution({
        requestId: context.requestId,
        useCaseName: context.useCaseName,
        hookName: 'onAbort',
        executionId: context.executionId,
        timestamp: new Date(),
        params: {
            reason,
            aborted: true,
            quotaExceeded: shared.quotaExceeded
        }
    });

    // For rate limit aborts, record in rate limit metrics
    if (reason.includes('Rate limit')) {
        rateLimitMetrics.recordAbort(context.actorUserId);
    }

    // No alerts for aborts (they're expected conditions)
};
```

---

### 7. onFinally

**Executes**: Always at the end (success, error, or abort)
**Available in context**: `input`, `stepResults`, `adapters`, `shared`, `context`, **`result`**

**Use cases**:

- Logging completion
- Metrics recording (duration, success rate)
- Cleanup operations
- Resource release
- Performance tracking

**Important**: Errors thrown here are caught and logged but don't affect the final result.

**Example**:

```typescript
onFinally: async ({ result, shared, context, adapters, stepResults }) => {
    const duration = Date.now() - shared.startTime;

    // Record comprehensive metrics
    await adapters.observability?.logHookExecution({
        requestId: context.requestId,
        useCaseName: context.useCaseName,
        hookName: 'onFinally',
        executionId: context.executionId,
        timestamp: new Date(),
        params: {
            duration,
            success: result.isSuccess,
            emailSent: shared.emailSent,
            blockedDomain: shared.blockedDomain,
            stepResults
        }
    });

    // Log completion
    const status = result.isSuccess ? 'SUCCESS' : 'FAILURE';
    console.log(`[${context.requestId}] ${context.useCaseName} ${status} in ${duration}ms`);

    // Record performance metric
    performanceMetrics.record({
        useCaseName: context.useCaseName,
        duration,
        success: result.isSuccess
    });

    // Cleanup
    if (shared.tempFile) {
        fs.unlinkSync(shared.tempFile);
    }
};
```

---

## Configuration

### Basic Configuration

Configure hooks in your `ToolkitOptions`:

```typescript
import type { ToolkitOptions } from '@multitenantkit/domain-contracts';

const config: ToolkitOptions = {
    useCaseHooks: {
        // Hook configuration for CreateUser use case
        CreateUser: {
            onStart: ({ input, shared }) => {
                shared.startTime = Date.now();
                console.log('Creating user:', input.externalId);
            },
            onFinally: ({ result, shared }) => {
                const duration = Date.now() - shared.startTime;
                console.log(`Completed in ${duration}ms`);
            }
        },

        // Hook configuration for UpdateUser use case
        UpdateUser: {
            afterValidation: async ({ stepResults, adapters, abort }) => {
                const user = await adapters.persistence.userRepository.findById(
                    stepResults.validatedInput.userId
                );

                if (user.status === 'suspended') {
                    abort('Cannot update suspended user');
                }
            }
        }
    }
};
```

### Type-Safe Configuration

All hooks are fully type-safe. TypeScript knows the exact input/output types for each use case:

```typescript
const config: ToolkitOptions = {
    useCaseHooks: {
        CreateUser: {
            onStart: ({ input }) => {
                // TypeScript knows: input is CreateUserInput
                console.log(input.externalId); // ✅ Correct
                console.log(input.invalidField); // ❌ TypeScript error
            },
            afterExecution: ({ stepResults }) => {
                // TypeScript knows: output is CreateUserOutput
                const output = stepResults.output!;
                console.log(output.id); // ✅ Correct
                console.log(output.invalidField); // ❌ TypeScript error
            }
        }
    }
};
```

---

## Common Use Cases

### Rate Limiting

```typescript
CreateUser: {
    onStart: async ({ context, adapters, abort }) => {
        const attempts = await rateLimiter.getAttempts(context.actorUserId);
        if (attempts > 5) {
            abort('Rate limit exceeded');
        }
    };
}
```

### Custom Validation

```typescript
UpdateUser: {
    afterValidation: async ({ stepResults, adapters }) => {
        const validated = stepResults.validatedInput!;

        // Check if email is already taken by another user
        const existingUser = await adapters.persistence.userRepository.findByEmail(validated.email);

        if (existingUser && existingUser.id !== validated.userId) {
            throw new ValidationError('Email is already taken');
        }
    };
}
```

### Audit Logging

```typescript
DeleteUser: {
    beforeExecution: async ({ stepResults, context, adapters }) => {
        await auditLog.record({
            requestId: context.requestId,
            userId: context.actorUserId,
            action: 'DELETE_USER',
            targetUserId: stepResults.validatedInput.userId,
            timestamp: adapters.system.clock.now()
        });
    };
}
```

### Side Effects (Email, Webhooks)

```typescript
CreateOrganization: {
    afterExecution: async ({ stepResults, shared }) => {
        const output = stepResults.output!;

        // Send email (don't abort on failure)
        try {
            await emailService.sendOrganizationCreated({
                to: output.ownerEmail,
                organizationName: output.name
            });
            shared.emailSent = true;
        } catch (error) {
            console.error('Email failed:', error);
            shared.emailSent = false;
        }

        // Trigger webhook (fire-and-forget)
        webhookService.trigger('organization.created', output).catch(console.error);
    };
}
```

### Performance Metrics

```typescript
GetUser: {
  onStart: ({ shared }) => {
    shared.startTime = Date.now();
  },
  onFinally: ({ shared, result, context }) => {
    const duration = Date.now() - shared.startTime;

    metrics.record({
      useCaseName: 'GetUser',
      duration,
      success: result.isSuccess,
      userId: context.actorUserId
    });
  }
}
```

### Feature Flags

```typescript
CreateUser: {
    onStart: async ({ abort }) => {
        const enabled = await featureFlags.isEnabled('user-registration');
        if (!enabled) {
            abort('User registration is currently disabled');
        }
    };
}
```

### Resource Cleanup

```typescript
ProcessFile: {
  onStart: ({ shared }) => {
    shared.tempFile = `/tmp/${Date.now()}.tmp`;
  },
  onFinally: ({ shared }) => {
    // Cleanup temp file
    if (shared.tempFile && fs.existsSync(shared.tempFile)) {
      fs.unlinkSync(shared.tempFile);
    }
  }
}
```

---

## Best Practices

### 1. Use `abort()` for Expected Conditions

Use `abort()` instead of throwing errors for expected business conditions:

```typescript
✅ Good: Using abort for rate limiting
afterValidation: ({ abort }) => {
  if (rateLimitExceeded) {
    abort('Rate limit exceeded');
  }
}

❌ Bad: Throwing error for expected condition
afterValidation: ({ }) => {
  if (rateLimitExceeded) {
    throw new Error('Rate limit exceeded'); // Will trigger onError
  }
}
```

### 2. Wrap Side Effects in try/catch

Side effects should not abort execution on failure:

```typescript
✅ Good: Catching side effect errors
afterExecution: async ({ stepResults, shared }) => {
  try {
    await emailService.send(stepResults.output);
    shared.emailSent = true;
  } catch (error) {
    console.error('Email failed:', error);
    shared.emailSent = false;
  }
}

❌ Bad: Letting side effect errors propagate
afterExecution: async ({ stepResults }) => {
  await emailService.send(stepResults.output); // Will abort if fails
}
```

### 3. Use Shared State for Data Between Hooks

Use `shared` to pass data between hooks:

```typescript
✅ Good: Using shared state
onStart: ({ shared }) => {
  shared.startTime = Date.now();
}
onFinally: ({ shared }) => {
  const duration = Date.now() - shared.startTime;
}

❌ Bad: Using external variables
let startTime: number; // Breaks with concurrent executions
onStart: () => {
  startTime = Date.now();
}
```

### 4. Don't Mutate Input or StepResults

Input and stepResults are readonly:

```typescript
✅ Good: Using adapters to modify data
afterValidation: async ({ stepResults, adapters, shared }) => {
  const user = await adapters.persistence.userRepository
    .findById(stepResults.validatedInput.userId);

  // Store computed value in shared
  shared.computedField = computeValue(user);
}

❌ Bad: Trying to mutate input
afterValidation: ({ stepResults }) => {
  stepResults.validatedInput.field = 'new value'; // TypeScript error
}
```

### 5. Return After Calling abort()

`abort()` doesn't throw, so return after calling it:

```typescript
✅ Good: Returning after abort
afterValidation: ({ abort }) => {
  if (condition) {
    abort('Reason');
    return; // Exit hook
  }
  // Continue processing
}

❌ Bad: Not returning after abort
afterValidation: ({ abort }) => {
  if (condition) {
    abort('Reason');
  }
  // Hook continues executing (might cause errors)
}
```

### 6. Use Appropriate Hook for Each Purpose

Choose the right hook for your use case:

- **onStart**: Setup, rate limiting, feature flags
- **afterValidation**: Custom validations, resource checks
- **beforeExecution**: Audit logging, final checks
- **afterExecution**: Side effects, notifications
- **onError**: Error logging, alerts
- **onAbort**: Abort logging, abort-specific handling
- **onFinally**: Metrics, cleanup, always-run operations

---

## Breaking Changes from Previous Version

### 1. Hook Parameters Changed

**Before**:

```typescript
onStart: ({ input, context, hookContext }) => {
    hookContext.shared.startTime = Date.now();
};
```

**After**:

```typescript
onStart: ({ input, context, shared }) => {
    shared.startTime = Date.now();
};
```

### 2. `afterAuthorization` Renamed to `beforeExecution`

**Before**:

```typescript
afterAuthorization: ({ validatedInput }) => {
    console.log('Authorized');
};
```

**After**:

```typescript
beforeExecution: ({ stepResults }) => {
    console.log('Authorized');
};
```

### 3. New `onAbort` Hook Added

```typescript
onAbort: ({ reason }) => {
    console.log('Aborted:', reason);
};
```

### 4. Input and StepResults are Now Readonly

```typescript
// This now causes a TypeScript error:
afterValidation: ({ stepResults }) => {
    stepResults.validatedInput.field = 'value'; // ❌ Error
};
```

---

## Migration Guide

### Step 1: Update Hook Signatures

Change from `UseCaseHookParams` to destructured `HookContext`:

```typescript
// Before
onStart: (params: UseCaseHookParams) => {
    const { input, context, hookContext } = params;
    hookContext.shared.startTime = Date.now();
};

// After
onStart: ({ input, context, shared }) => {
    shared.startTime = Date.now();
};
```

### Step 2: Rename `afterAuthorization` to `beforeExecution`

```typescript
// Before
useCaseHooks: {
    UpdateUser: {
        afterAuthorization: ({ validatedInput }) => {};
    }
}

// After
useCaseHooks: {
    UpdateUser: {
        beforeExecution: ({ stepResults }) => {
            const validated = stepResults.validatedInput!;
        };
    }
}
```

### Step 3: Use `abort()` Instead of Throwing for Expected Conditions

```typescript
// Before
afterValidation: () => {
    if (rateLimitExceeded) {
        throw new Error('Rate limit');
    }
};

// After
afterValidation: ({ abort }) => {
    if (rateLimitExceeded) {
        abort('Rate limit exceeded');
    }
};
```

### Step 4: Add `onAbort` Hook if Needed

```typescript
useCaseHooks: {
    CreateUser: {
        onAbort: ({ reason, shared }) => {
            console.log('Aborted:', reason);
            metrics.recordAbort(shared.userId);
        };
    }
}
```

---

## FAQ

### Q: When should I use `abort()` vs throwing an error?

**A**: Use `abort()` for expected business conditions that should stop execution cleanly (rate limits, feature flags, quota exceeded). Use `throw` for actual errors (validation failures, infrastructure errors).

### Q: Can hooks modify the input?

**A**: No. Input and stepResults are readonly. Use adapters to persist modifications, or use `shared` to pass computed values.

### Q: What happens if a hook throws an error?

**A**: The use case execution stops, `onError` hook is triggered, and an error result is returned.

### Q: Can I access repositories from hooks?

**A**: Yes! Use `adapters.persistence.userRepository`, etc.

### Q: How do I pass data between hooks?

**A**: Use the `shared` object: `shared.myData = value`.

### Q: What if my side effect fails in `afterExecution`?

**A**: Wrap side effects in try/catch to prevent aborting the execution on side effect failures.

---

## Summary

The Use Case Hooks System provides a powerful, flexible, and type-safe way to extend use case behavior. Key benefits:

- ✅ **Non-invasive**: Extend behavior without modifying core logic
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Flexible**: 7 hook points covering entire lifecycle
- ✅ **Powerful**: Full adapter access for complex operations
- ✅ **Clean**: Graceful abort mechanism for expected conditions
- ✅ **Safe**: Immutable input/stepResults prevent bugs

Use hooks for cross-cutting concerns like logging, metrics, rate limiting, validation, side effects, and audit trails while keeping your business logic clean and focused.
