# Response Transformers

Response transformers allow you to modify HTTP responses before they are returned to the client. This provides a powerful way to customize your API responses without modifying core business logic.

## Table of Contents

-   [What is a Response Transformer?](#what-is-a-response-transformer)
-   [When to Use Response Transformers](#when-to-use-response-transformers)
-   [How it Works](#how-it-works)
-   [Configuration](#configuration)
-   [Available Context](#available-context)
-   [Common Use Cases](#common-use-cases)
-   [Examples](#examples)
-   [Best Practices](#best-practices)
-   [Limitations](#limitations)

## What is a Response Transformer?

A response transformer is an async function that receives the full context of an HTTP request and response, and returns a potentially modified response. It runs after the use case has executed successfully but before the response is sent to the client.

```typescript
type ResponseTransformer<TInput, TOutput> = (
    context: ResponseTransformerContext<TInput, TOutput>
) => Promise<{
    status: number;
    body: any;
    headers?: Record<string, string>;
}>;
```

## When to Use Response Transformers

Response transformers are ideal for:

-   **Security**: Removing sensitive fields (e.g., internal IDs, system metadata)
-   **Data Enrichment**: Adding computed fields (e.g., full name from firstName + lastName)
-   **Format Transformation**: Changing response structure (e.g., flattening nested objects)
-   **Field Name Transformation**: Converting between naming conventions (e.g., camelCase ↔ snake_case)
-   **Metadata Addition**: Adding timestamps, version info, or custom headers
-   **Multi-tenancy**: Customizing responses per tenant/organization
-   **API Versioning**: Supporting multiple API versions with different response formats

## How it Works

1. **Handler executes use case** → Gets domain entity as result
2. **Handler builds base response** → Wraps result in standard API format
3. **Handler checks for transformer** → Looks up configured transformer for this endpoint
4. **Transformer runs (if configured)** → Receives full context and returns modified response
5. **Response sent to client** → Either transformed or original response

**Key Features:**

-   **Opt-in**: Handlers work normally without transformers
-   **Fail-safe**: If transformer throws error, original response is returned
-   **Type-safe**: Full TypeScript support with generics
-   **Context-rich**: Access to request, response, and use case result

## Configuration

Configure transformers in your `ToolkitOptions`:

```typescript
const config: ToolkitOptions = {
    responseTransformers: {
        users: {
            GetUser: myUserTransformer,
            CreateUser: myCreateUserTransformer,
            UpdateUser: myUpdateUserTransformer,
            DeleteUser: myDeleteUserTransformer,
            ListUserOrganizations: myListOrganizationsTransformer,
        },
        organizations: {
            GetOrganization: myOrgTransformer,
            CreateOrganization: myCreateOrgTransformer,
            UpdateOrganization: myUpdateOrgTransformer,
            DeleteOrganization: myDeleteOrgTransformer,
            ListOrganizationMembers: myListMembersTransformer,
        },
        organizationMemberships: {
            AddOrganizationMember: myAddMemberTransformer,
            RemoveOrganizationMember: myRemoveMemberTransformer,
            UpdateOrganizationMember: myUpdateMemberTransformer,
        },
    },
};
```

## Available Context

Transformers receive rich context:

```typescript
interface ResponseTransformerContext<TInput, TOutput> {
    request: {
        input: TInput; // Validated request input
        principal?: Principal; // Authenticated user
        requestId: string; // Request ID for tracing
    };
    response: {
        status: number; // HTTP status code
        body: any; // Response body (ApiResponse<T>)
        headers?: Record<string, string>; // HTTP headers
    };
    useCaseResult: IResult<TOutput, IDomainError>; // Original use case result
}
```

## Common Use Cases

### 1. Remove Sensitive Fields

```typescript
const removeSensitiveFields: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    const { response } = context;
    const user = response.body.data;

    // Remove internal fields
    const { internalId, systemMetadata, ...publicData } = user;

    return {
        ...response,
        body: {
            ...response.body,
            data: publicData,
        },
    };
};
```

### 2. Add Computed Fields

```typescript
const addComputedFields: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    const { response } = context;
    const user = response.body.data;

    return {
        ...response,
        body: {
            ...response.body,
            data: {
                ...user,
                fullName: `${user.firstName} ${user.lastName}`,
                avatarUrl: `https://avatars.example.com/${user.id}.jpg`,
            },
        },
    };
};
```

### 3. Change Response Format

```typescript
const flattenResponse: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    const { response } = context;
    const user = response.body.data;

    // Flatten nested structures
    return {
        ...response,
        body: {
            ...response.body,
            data: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                // Flatten nested address
                street: user.address?.street,
                city: user.address?.city,
                country: user.address?.country,
            },
        },
    };
};
```

### 4. Transform Field Names

```typescript
const toSnakeCase: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    const { response } = context;
    const user = response.body.data;

    return {
        ...response,
        body: {
            ...response.body,
            data: {
                user_id: user.id,
                external_id: user.externalId,
                first_name: user.firstName,
                last_name: user.lastName,
                created_at: user.createdAt,
                updated_at: user.updatedAt,
            },
        },
    };
};
```

### 5. Add Custom Headers

```typescript
const addCacheHeaders: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    const { response } = context;

    return {
        ...response,
        headers: {
            ...response.headers,
            "Cache-Control": "public, max-age=300",
            ETag: `"${response.body.data.updatedAt}"`,
        },
    };
};
```

### 6. Multi-tenant Customization

```typescript
const customizeForTenant: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    const { response, request } = context;
    const user = response.body.data;
    const tenantId = request.principal?.organizationId;

    // Load tenant-specific configuration
    const tenantConfig = await getTenantConfig(tenantId);

    // Customize response based on tenant
    if (tenantConfig.showInternalIds) {
        return response; // Return full data
    } else {
        // Remove internal fields for this tenant
        const { internalId, ...publicData } = user;
        return {
            ...response,
            body: {
                ...response.body,
                data: publicData,
            },
        };
    }
};
```

## Examples

### Complete Example with Error Handling

```typescript
const safeUserTransformer: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    try {
        const { response, request } = context;
        const user = response.body.data;

        // Apply transformations
        const transformedData = {
            ...user,
            fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            // Only include email if user owns this profile
            email:
                request.principal?.userId === user.id ? user.email : undefined,
        };

        return {
            ...response,
            body: {
                ...response.body,
                data: transformedData,
            },
        };
    } catch (error) {
        // Transformers should not throw - return original response
        console.error("Transformer error:", error);
        return context.response;
    }
};
```

### Reusable Transformer Factory

```typescript
function createFieldRemover<TInput, TOutput extends Record<string, any>>(
    fieldsToRemove: string[]
): ResponseTransformer<TInput, TOutput> {
    return async (context) => {
        const { response } = context;
        const data = response.body.data;

        // Remove specified fields
        const cleanedData = Object.keys(data).reduce((acc, key) => {
            if (!fieldsToRemove.includes(key)) {
                acc[key] = data[key];
            }
            return acc;
        }, {} as any);

        return {
            ...response,
            body: {
                ...response.body,
                data: cleanedData,
            },
        };
    };
}

// Usage
const config: ToolkitOptions = {
    responseTransformers: {
        users: {
            GetUser: createFieldRemover(["internalId", "systemMetadata"]),
            CreateUser: createFieldRemover(["internalId"]),
        },
    },
};
```

## Best Practices

### 1. Keep Transformers Simple and Focused

```typescript
// ✅ Good: Single responsibility
const removeInternalId: ResponseTransformer = async (context) => {
    const { internalId, ...data } = context.response.body.data;
    return { ...context.response, body: { ...context.response.body, data } };
};

// ❌ Bad: Too many responsibilities
const doEverything: ResponseTransformer = async (context) => {
    // Removing fields, adding fields, fetching data, logging, etc.
    // This should be split into multiple transformers or moved to use case
};
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good: Fail-safe with error handling
const safeTransformer: ResponseTransformer = async (context) => {
    try {
        // Transformation logic
        return transformedResponse;
    } catch (error) {
        console.error("Transformer failed:", error);
        return context.response; // Return original on error
    }
};
```

### 3. Avoid Heavy Operations

```typescript
// ❌ Bad: Database queries in transformer
const badTransformer: ResponseTransformer = async (context) => {
    const additionalData = await db.query(...); // Slow!
    // ...
};

// ✅ Good: Simple data transformation
const goodTransformer: ResponseTransformer = async (context) => {
    const { data } = context.response.body;
    return { ...context.response, body: { ...context.response.body, data: {...data, computed: data.a + data.b} } };
};
```

### 4. Use Type Guards

```typescript
const typeSafeTransformer: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    const data = context.response.body.data;

    // Type guard
    if (!data || typeof data !== "object") {
        return context.response;
    }

    // Now safe to access properties
    const transformed = {
        ...data,
        fullName: `${data.firstName} ${data.lastName}`,
    };
    return {
        ...context.response,
        body: { ...context.response.body, data: transformed },
    };
};
```

### 5. Document Transformations

```typescript
/**
 * Removes sensitive user fields for public API responses
 *
 * Removed fields:
 * - internalId: Internal database ID
 * - systemMetadata: System tracking information
 * - lastLoginIp: Privacy sensitive
 *
 * @example
 * Input: { id: '123', internalId: '456', email: 'user@example.com', ... }
 * Output: { id: '123', email: 'user@example.com', ... }
 */
const removeSensitiveFields: ResponseTransformer<GetUserInput, User> = async (
    context
) => {
    // Implementation
};
```

## Limitations

### Current Limitations

1. **Success Responses Only**: Transformers only run for successful responses (status 2xx). Error responses are not transformed.
2. **No Async Data Fetching**: Transformers should be fast. Avoid database queries or external API calls.
3. **No Request Modification**: Transformers can only modify responses, not requests.
4. **No Multi-step Pipelines**: Cannot chain multiple transformers (apply one transformer per handler).

### Planned Future Enhancements

-   **Error Response Transformation**: Support transforming error responses
-   **Transformer Pipelines**: Chain multiple transformers
-   **Conditional Transformers**: Apply transformers based on conditions (e.g., user role, tenant)
-   **Caching Integration**: Built-in caching support for expensive transformations

### Workarounds

**Need multiple transformations?** Compose them in a single transformer:

```typescript
const combinedTransformer: ResponseTransformer = async (context) => {
    let result = context.response;

    // Apply transformations in sequence
    result = await removeFieldsTransform(result);
    result = await addFieldsTransform(result);
    result = await formatTransform(result);

    return result;
};
```

## Troubleshooting

### Transformer Not Running

1. Check transformer is configured in `ToolkitOptions`
2. Verify handler name matches exactly (case-sensitive)
3. Ensure `toolkitOptions` is passed to handler factory
4. Check logs for transformer errors (errors are caught and logged)

### Response Not Changing

1. Verify transformer is actually modifying the response object
2. Check if transformer is returning the modified response
3. Ensure transformation logic is correct
4. Add console.log to debug

### Type Errors

1. Ensure generic types match use case input/output
2. Use `any` for generic transformers if needed
3. Check TypeScript compiler errors for hints

## Support

For questions or issues:

-   Review handler implementations in `packages/api/handlers/src/`
-   Check transformer utility in `packages/api/handlers/src/utils/transformResponse.ts`
-   See `ResponseTransformer.ts` for full type definitions
