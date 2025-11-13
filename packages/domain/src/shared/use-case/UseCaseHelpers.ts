import type { OperationContext } from '@multitenantkit/domain-contracts';
import { NotFoundError } from '@multitenantkit/domain-contracts';
import { Result } from '../result/Result';

/**
 * Helper functions for common use case patterns
 *
 * Philosophy: Keep it minimal. Only extract truly repetitive patterns.
 * If a helper reduces readability, don't use it.
 */
export class UseCaseHelpers {
    /**
     * Find entity by ID or return NotFoundError
     *
     * Common pattern across many use cases that retrieve entities by ID
     *
     * @example
     * const userResult = await UseCaseHelpers.findByIdOrFail(
     *     this.adapters.persistence.userRepository,
     *     input.userId,
     *     "User"
     * );
     * if (userResult.isFailure) return userResult;
     * const user = userResult.getValue();
     */
    static async findByIdOrFail<T>(
        repository: { findById: (id: string) => Promise<T | null> },
        id: string,
        entityName: string
    ): Promise<Result<T, NotFoundError>> {
        const entity = await repository.findById(id.trim());
        if (!entity) {
            return Result.fail(
                new NotFoundError(entityName, id, {
                    reason: `${entityName} not found`
                })
            );
        }
        return Result.ok(entity);
    }

    /**
     * Enrich audit context with specific action and metadata
     *
     * Ensures consistent audit context across all use cases
     *
     * @example
     * const auditContext = UseCaseHelpers.enrichAuditContext(
     *     context,
     *     "CREATE_USER",
     *     undefined,
     *     { source: "admin-panel" }
     * );
     */
    static enrichAuditContext(
        context: OperationContext,
        action: string,
        organizationId?: string,
        metadata?: Record<string, any>
    ): OperationContext {
        return {
            ...context,
            auditAction: action,
            organizationId: organizationId ?? context.organizationId,
            metadata: { ...context.metadata, ...metadata }
        };
    }
}
