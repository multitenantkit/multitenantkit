/**
 * Hooks system for use case lifecycle
 * Allows executing custom logic at specific points during use case execution
 *
 * The hook system provides:
 * - Unified HookContext with full access to adapters, input, and step results
 * - Graceful abort mechanism via ctx.abort(reason)
 * - Immutable input and stepResults (readonly)
 * - Shared mutable state between hooks
 * - Full lifecycle hooks: onStart, afterValidation, beforeExecution, afterExecution, onError, onAbort, onFinally
 *
 * @example
 * ```typescript
 * import type { UseCaseHooksConfig } from '@multitenantkit/domain-contracts';
 *
 * const hooks: UseCaseHooksConfig = {
 *     CreateUser: {
 *         onStart: ({ input, shared }) => {
 *             console.log('Creating user:', input.externalId);
 *             shared.startTime = Date.now();
 *         },
 *         afterValidation: async ({ stepResults, adapters, abort }) => {
 *             // Custom validation using adapters
 *             const user = await adapters.persistence.userRepository
 *                 .findByExternalId(stepResults.validatedInput.externalId);
 *
 *             if (user) {
 *                 abort('User already exists');
 *             }
 *         },
 *         onFinally: ({ result, shared }) => {
 *             const duration = Date.now() - shared.startTime;
 *             console.log(`Completed in ${duration}ms`, result.isSuccess);
 *         }
 *     }
 * };
 * ```
 */

export type { HookContext } from './HookContext';
export type { UseCaseHooks } from './UseCaseHooks';
export type { UseCaseHooksConfig } from './UseCaseHooksConfig';

// Legacy export kept for backwards compatibility during migration
// @deprecated Use HookContext instead
export type { HookExecutionContext } from './HookExecutionContext';
