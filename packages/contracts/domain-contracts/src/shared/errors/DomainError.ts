import type { IDomainError } from './IDomainError';

type NormalizedError = {
    name?: string;
    message: string;
    stack?: string;
    cause?: unknown;
    [key: string]: unknown;
};

function normalizeError(err: unknown): NormalizedError {
    if (err instanceof Error) {
        // Copy all properties from the error object
        const ownNames = Object.getOwnPropertyNames(err) as (keyof Error)[];
        const plain: Record<string, unknown> = {};
        for (const key of ownNames) {
            plain[key as string] = (err as any)[key];
        }
        // If the error has extra "enumerable" properties in custom classes, include them as well
        for (const key of Object.keys(err as object)) {
            plain[key] = (err as any)[key];
        }
        // Ensure minimum message
        return {
            message: err.message ?? String(err),
            ...plain
        };
    }

    if (typeof err === 'object' && err !== null) {
        // If it's an object, clone it (it might have enumerable properties)
        return { message: 'Non-Error thrown', ...(err as any) };
    }

    // If it's a string, number, etc.
    return { message: String(err) };
}

/**
 * Base class for all domain errors
 * Implements the DomainError interface from domain-contracts
 * Provides consistent error handling across the domain
 */
export abstract class DomainError extends Error implements IDomainError {
    public readonly code?: string;
    public readonly details?: Record<string, unknown>;

    constructor(message: string, code?: string, details?: Record<string, unknown>) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        if (this.details?.originalError) {
            this.details.originalError = normalizeError(this.details.originalError);
        }
        if (this.details?.error) {
            this.details.error = normalizeError(this.details.error);
        }

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends DomainError {
    constructor(resource: string, identifier: string, details?: Record<string, unknown>) {
        super(`${resource} with identifier '${identifier}' not found`, 'NOT_FOUND', {
            resource,
            identifier,
            ...details
        });
    }
}

/**
 * Error thrown when a validation fails
 */
export class ValidationError extends DomainError {
    public readonly field?: string;

    constructor(message: string, field?: string, details?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', { field, ...details });
        this.field = field;
    }
}

/**
 * Error thrown when a business rule is violated
 */
export class BusinessRuleError extends DomainError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'BUSINESS_RULE_VIOLATION', details);
    }
}

/**
 * Error thrown when trying to create a resource that already exists
 */
export class ConflictError extends DomainError {
    constructor(resource: string, identifier: string, details?: Record<string, unknown>) {
        super(`${resource} with identifier '${identifier}' already exists`, 'CONFLICT', {
            resource,
            identifier,
            ...details
        });
    }
}

/**
 * Error thrown when access is denied
 */
export class UnauthorizedError extends DomainError {
    constructor(action: string, resource?: string, details?: Record<string, unknown>) {
        const message = resource
            ? `Not authorized to ${action} on ${resource}`
            : `Not authorized to ${action}`;

        super(message, 'UNAUTHORIZED', { action, resource, ...details });
    }
}

/**
 * Error thrown when infrastructure operations fail
 */
export class InfrastructureError extends DomainError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'INFRASTRUCTURE_ERROR', details);
    }
}

/**
 * Error thrown when a use case execution is gracefully aborted
 * This error is used when a hook requests abortion via the abort() function
 * instead of throwing an exception, allowing for cleaner control flow
 */
export class AbortedError extends DomainError {
    public readonly reason: string;

    constructor(reason: string, details?: Record<string, unknown>) {
        super(`Use case execution aborted: ${reason}`, 'ABORTED', { reason, ...details });
        this.reason = reason;
    }
}
