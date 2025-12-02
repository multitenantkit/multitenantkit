/**
 * Operation context for audit logging
 * Provides information about who is performing an operation and in what context
 */
import type { z } from 'zod';
import type { Uuid } from './primitives';

export type UuidString = z.infer<typeof Uuid>;

export interface OperationContext {
    /**
     * Unique identifier for the request
     * Used for tracing and grouping logs across the system
     */
    requestId: string;

    /**
     * ID of the user performing the operation
     */
    externalId: string;

    /**
     * ID of the organization context for the operation (optional)
     * Determined by the use case based on business context
     */
    organizationId?: UuidString;

    /**
     * Additional metadata for the operation
     */
    metadata?: AuditMetadata;

    /**
     * Specific business action being performed (optional)
     * Examples: 'CREATE_USER', 'UPDATE_ORGANIZATION', 'ADD_MEMBER'
     */
    auditAction?: string;
}

/**
 * Extensible metadata for audit operations
 */
export interface AuditMetadata {
    /**
     * Device information from where the operation originated
     */
    deviceInfo?: string;

    /**
     * IP address of the client
     */
    ipAddress?: string;

    /**
     * User agent string from the client
     */
    userAgent?: string;

    /**
     * Source of the operation
     */
    source?: 'web' | 'mobile' | 'api' | 'system';

    /**
     * Extensible for future metadata requirements
     */
    [key: string]: any;
}
