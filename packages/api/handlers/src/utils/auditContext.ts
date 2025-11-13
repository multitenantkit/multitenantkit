import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import { Principal } from '@multitenantkit/domain-contracts/shared/auth/Principal';

/**
 * Helper function to build OperationContext from HTTP request context
 * This centralizes the audit context creation logic for all HTTP handlers
 */
export function buildOperationContext(
    requestId: string,
    principal?: Principal,
    auditAction?: string,
    organizationId?: string
): OperationContext {
    // Use the authenticated user's ID, or 'system' for unauthenticated operations
    const actorUserId = principal?.authProviderId || '00000000-0000-0000-0000-000000000000';

    return {
        requestId,
        actorUserId,
        organizationId,
        auditAction,
        metadata: {
            source: 'api' as const
            // Additional metadata could be added here:
            // - IP address from request headers
            // - User agent from request headers
            // - Device information
        }
    };
}

/**
 * Enhanced version that can extract additional metadata from request context
 * This can be extended in the future to include more audit metadata
 */
export function buildOperationContextWithMetadata(
    requestId: string,
    principal?: Principal,
    auditAction?: string,
    organizationId?: string,
    additionalMetadata?: {
        ipAddress?: string;
        userAgent?: string;
        deviceInfo?: string;
    }
): OperationContext {
    const actorUserId = principal?.authProviderId || '00000000-0000-0000-0000-000000000000';

    return {
        requestId,
        actorUserId,
        organizationId,
        auditAction,
        metadata: {
            source: 'api' as const,
            ...additionalMetadata
        }
    };
}
