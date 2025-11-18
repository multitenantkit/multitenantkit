import { randomUUID } from 'node:crypto';
import type {
    Adapters,
    DomainError,
    HookContext,
    OperationContext,
    ToolkitOptions,
    UseCaseHooks,
    User
} from '@multitenantkit/domain-contracts';
import {
    AbortedError,
    InfrastructureError,
    NotFoundError,
    ValidationError
} from '@multitenantkit/domain-contracts';
import type { z } from 'zod';
import { Result } from '../result/Result';

/**
 * Base class for all use cases following a consistent execution pipeline.
 *
 * Provides automatic:
 * - Input validation with Zod schemas
 * - Output parsing/transformation
 * - Error handling and wrapping
 * - Hook lifecycle management with abort support
 * - Consistent structure across all use cases
 *
 * @template TInput - Input type for the use case
 * @template TOutput - Output type returned by the use case
 * @template TError - Domain error types that can be returned
 * @template TCustomFields - Custom fields extension for entities
 * @template TOrganizationCustomFields - Custom fields for organizations (toolkit options compatibility)
 * @template TOrganizationMembershipCustomFields - Custom fields for organization memberships (toolkit options compatibility)
 */
export abstract class BaseUseCase<
    TInput,
    TOutput,
    TError extends DomainError = DomainError,
    TCustomFields = any,
    TOrganizationCustomFields = any,
    TOrganizationMembershipCustomFields = any
> {
    /**
     * Abort state tracking
     * These track whether a hook has requested abort and the reason
     */
    private abortRequested: boolean = false;
    private abortReason: string = '';

    /**
     * Shared state object for hooks
     * Reset at the start of each execution
     */
    private sharedState: Record<string, any> = {};

    /**
     * Step results object for hooks
     * Stores results from each pipeline step
     */
    private stepResults: {
        validatedInput?: TInput;
        authorized?: boolean;
        output?: TOutput;
    } = {};

    /**
     * Execution ID for tracking
     * Generated at the start of each execution
     */
    private executionId: string = '';

    /**
     * Use case name in format "entity-useCaseName"
     * Example: "user-updateUser", "organization-createOrganization"
     * This helps prevent name collisions between different entities
     */
    protected readonly useCaseName: string;

    constructor(
        useCaseName: string,
        protected readonly adapters: Adapters<
            TCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >,
        protected readonly toolkitOptions:
            | ToolkitOptions<
                  TCustomFields,
                  TOrganizationCustomFields,
                  TOrganizationMembershipCustomFields
              >
            | undefined,
        private readonly inputSchema: z.ZodType<TInput>,
        private readonly outputSchema: z.ZodType<TOutput>,
        private readonly errorMessage: string
    ) {
        this.useCaseName = useCaseName;
    }

    /**
     * Initialize execution state for a new execution
     * Resets abort state, shared state, step results, and generates execution ID
     */
    private initializeExecutionState(): void {
        this.abortRequested = false;
        this.abortReason = '';
        this.sharedState = {};
        this.stepResults = {};
        this.executionId = randomUUID();
    }

    /**
     * Create abort function for hook context
     * When called, sets abort state which will be checked after each hook
     *
     * @returns Abort function that hooks can call
     */
    private createAbortFunction(): (reason: string) => void {
        return (reason: string) => {
            this.abortRequested = true;
            this.abortReason = reason;
        };
    }

    /**
     * Check if abort was requested
     * Should be called after each hook execution
     *
     * @returns true if abort was requested
     */
    private checkAborted(): boolean {
        return this.abortRequested;
    }

    /**
     * Build HookContext object for passing to hooks
     * Provides immutable access to input/stepResults and mutable shared state
     *
     * @param input - Original input to the use case
     * @param context - Operation context
     * @returns HookContext object
     */
    private buildHookContext(
        input: TInput,
        context: OperationContext
    ): HookContext<
        TInput,
        TOutput,
        TCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    > {
        return {
            executionId: this.executionId,
            useCaseName: this.useCaseName,
            input: input, // Readonly via type
            stepResults: this.stepResults, // Readonly via type
            shared: this.sharedState,
            adapters: this.adapters,
            context: context,
            abort: this.createAbortFunction()
        };
    }

    /**
     * Get configured hooks for this use case from ToolkitOptions
     *
     * @returns UseCaseHooks if configured, undefined otherwise
     */
    private getHooksConfig():
        | UseCaseHooks<
              TInput,
              TOutput,
              TError,
              TCustomFields,
              TOrganizationCustomFields,
              TOrganizationMembershipCustomFields
          >
        | undefined {
        if (!this.toolkitOptions?.useCaseHooks) {
            return undefined;
        }

        const useCaseName = this.constructor.name as keyof typeof this.toolkitOptions.useCaseHooks;
        return this.toolkitOptions.useCaseHooks[useCaseName] as
            | UseCaseHooks<
                  TInput,
                  TOutput,
                  TError,
                  TCustomFields,
                  TOrganizationCustomFields,
                  TOrganizationMembershipCustomFields
              >
            | undefined;
    }

    /**
     * Execute a hook safely with error handling and metrics logging
     * If hook throws an error, it propagates (hooks can abort execution)
     *
     * @param hookFn - Hook function to execute
     * @param ctx - HookContext to pass to the hook
     * @param hookName - Name of the hook for logging purposes
     */
    private async executeHook(
        hookFn:
            | ((
                  ctx: HookContext<
                      TInput,
                      TOutput,
                      TCustomFields,
                      TOrganizationCustomFields,
                      TOrganizationMembershipCustomFields
                  >
              ) => Promise<void> | void)
            | undefined,
        ctx: HookContext<
            TInput,
            TOutput,
            TCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >,
        hookName: string
    ): Promise<void> {
        // 🔥 Fire-and-forget: Log hook execution (without await)
        this.logMetrics(hookName, ctx);

        if (!hookFn) {
            return;
        }

        await hookFn(ctx as any);
    }

    /**
     * Log hook execution metrics (fire-and-forget)
     * Errors are silently caught to not affect execution flow
     *
     * @param hookName - Name of the hook being executed
     * @param ctx - Hook context (will be filtered for PII)
     */
    private logMetrics(
        hookName: string,
        ctx: HookContext<
            TInput,
            TOutput,
            TCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ): void {
        try {
            // Fire-and-forget (no await)
            this.adapters.observability
                ?.logHookExecution({
                    requestId: ctx.context.requestId || 'unknown',
                    useCaseName: this.useCaseName,
                    hookName,
                    executionId: ctx.executionId,
                    timestamp: new Date(),
                    params: ctx as any
                })
                .catch(() => {
                    // Silent fail - metrics should never break execution
                });
        } catch {
            // Silent fail - if extracting data fails, don't break execution
        }
    }

    /**
     * Get user from external ID (auth provider ID)
     *
     * This helper maps the external auth provider ID to the internal User entity.
     * It's used by use cases that operate on the authenticated user.
     *
     * @param externalId - Auth provider user ID (from Principal.authProviderId)
     * @returns User entity with internal ID
     * @throws NotFoundError if user doesn't exist
     *
     * @example
     * ```typescript
     * // In a use case
     * const user = await this.getUserFromExternalId(context.principal.authProviderId);
     * ```
     */
    protected async getUserFromExternalId(
        externalId: string
    ): Promise<Result<User & TCustomFields, DomainError>> {
        if (!this.adapters.persistence.userRepository) {
            return Result.fail(
                new InfrastructureError('UserRepository is required for getUserFromExternalId')
            );
        }

        const user = await this.adapters.persistence.userRepository.findByExternalId(externalId);
        if (!user) {
            return Result.fail(
                new NotFoundError('User', externalId, {
                    message:
                        'User not found with the provided external ID from auth provider. Please ensure the user is registered in the system.'
                })
            );
        }

        return Result.ok(user);
    }

    /**
     * Main execution method - defines the pipeline with hook integration
     *
     * Pipeline stages:
     * 1. Initialize execution state
     * 2. onStart hook
     * 3. Validate input with schema
     * 4. afterValidation hook
     * 5. Authorize (optional)
     * 6. beforeExecution hook (renamed from afterAuthorization)
     * 7. Execute business logic
     * 8. afterExecution hook
     * 9. Parse output with schema
     * 10. onError hook (if error occurs)
     * 11. onAbort hook (if abort requested)
     * 12. onFinally hook (always executes)
     */
    public async execute(
        input: TInput,
        context: OperationContext
    ): Promise<Result<TOutput, TError>> {
        // Initialize execution state
        this.initializeExecutionState();
        const hooks = this.getHooksConfig();

        let result = await this.withErrorHandling(async () => {
            // Build hook context (will be updated as execution progresses)
            const hookCtx = this.buildHookContext(input, context);

            // HOOK 1: onStart - before validation
            await this.executeHook(hooks?.onStart, hookCtx, 'onStart');
            if (this.checkAborted()) {
                return Result.fail(new AbortedError(this.abortReason)) as unknown as Result<
                    TOutput,
                    TError
                >;
            }

            // 1. Validate input
            const validatedInput = await this.validateInput(input);
            if (validatedInput.isFailure) {
                return validatedInput as unknown as Result<TOutput, TError>;
            }

            // Store validated input in step results
            this.stepResults.validatedInput = validatedInput.getValue();

            // HOOK 2: afterValidation - after successful validation
            await this.executeHook(hooks?.afterValidation, hookCtx, 'afterValidation');
            if (this.checkAborted()) {
                return Result.fail(new AbortedError(this.abortReason)) as unknown as Result<
                    TOutput,
                    TError
                >;
            }

            // 2. Authorize (optional)
            const authResult = await this.authorize(validatedInput.getValue(), context);
            if (authResult.isFailure) {
                return authResult as Result<TOutput, TError>;
            }

            // Store authorization result in step results
            this.stepResults.authorized = true;

            // HOOK 3: beforeExecution - after successful authorization, before business logic
            await this.executeHook(hooks?.beforeExecution, hookCtx, 'beforeExecution');
            if (this.checkAborted()) {
                return Result.fail(new AbortedError(this.abortReason)) as unknown as Result<
                    TOutput,
                    TError
                >;
            }

            // 3. Execute business logic
            const businessResult = await this.executeBusinessLogic(
                validatedInput.getValue(),
                context
            );
            if (businessResult.isFailure) {
                return businessResult;
            }

            // Store business output in step results
            this.stepResults.output = businessResult.getValue();

            // HOOK 4: afterExecution - after successful business logic
            await this.executeHook(hooks?.afterExecution, hookCtx, 'afterExecution');
            if (this.checkAborted()) {
                return Result.fail(new AbortedError(this.abortReason)) as unknown as Result<
                    TOutput,
                    TError
                >;
            }

            // 4. Parse and return output
            return this.parseOutput(businessResult.getValue());
        });

        // If result is AbortedError, execute onAbort hook
        if (result.isFailure && result.getError() instanceof AbortedError) {
            try {
                const hookCtx = this.buildHookContext(input, context);
                const onAbortHook = hooks?.onAbort;
                if (onAbortHook) {
                    this.logMetrics('onAbort', hookCtx);
                    await onAbortHook({ ...hookCtx, reason: this.abortReason } as any);
                }
            } catch (abortError) {
                // onAbort errors are logged but don't affect the abort result
                console.error(`Error in onAbort hook for ${this.useCaseName}:`, abortError);
            }
        }
        // If result is failure (but not abort), execute onError hook
        else if (result.isFailure) {
            try {
                const hookCtx = this.buildHookContext(input, context);
                const onErrorHook = hooks?.onError;
                if (onErrorHook) {
                    // HOOK 5: onError - after failure
                    this.logMetrics('onError', hookCtx);
                    await onErrorHook({ ...hookCtx, error: result.getError() } as any);
                }
            } catch (error) {
                // If onError hook throws, create new error result
                result = Result.fail(
                    new ValidationError(this.errorMessage, undefined, {
                        originalError: result.getError() as TError,
                        error
                    })
                ) as unknown as Result<TOutput, TError>;
            }
        }

        // HOOK 6: onFinally - always executes, errors are caught and logged
        try {
            const hookCtx = this.buildHookContext(input, context);
            const onFinallyHook = hooks?.onFinally;
            if (onFinallyHook) {
                this.logMetrics('onFinally', hookCtx);
                await onFinallyHook({ ...hookCtx, result } as any);
            }
        } catch (finallyError) {
            // onFinally errors don't affect the result, just log them
            console.error(`Error in onFinally hook for ${this.useCaseName}:`, finallyError);
        }

        return result;
    }

    /**
     * Validates input using the provided Zod schema
     */
    private async validateInput(input: TInput): Promise<Result<TInput, ValidationError>> {
        const validationResult = this.inputSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }
        return Result.ok(validationResult.data);
    }

    /**
     * Authorization hook - override for permission checks
     * Default: no authorization
     */
    protected async authorize(
        _input: TInput,
        _context: OperationContext
    ): Promise<Result<void, DomainError>> {
        return Result.ok(undefined);
    }

    /**
     * Main business logic - must be implemented by each use case
     * This is where the actual domain logic lives
     */
    protected abstract executeBusinessLogic(
        input: TInput,
        context: OperationContext
    ): Promise<Result<TOutput, TError>>;

    /**
     * Parses output using the provided Zod schema
     */
    private parseOutput(data: TOutput): Result<TOutput, TError> {
        try {
            // Handle void/undefined case - no need to spread
            const valueToParse =
                data === undefined
                    ? undefined
                    : Array.isArray(data)
                      ? (data as unknown)
                      : ({ ...(data as any) } as unknown);
            const parsed = this.outputSchema.parse(valueToParse) as TOutput;
            return Result.ok(parsed);
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to parse output', undefined, {
                    originalError: error
                })
            ) as unknown as Result<TOutput, TError>;
        }
    }

    /**
     * Wraps execution in try-catch for consistent error handling
     */
    private async withErrorHandling(
        operation: () => Promise<Result<TOutput, TError>>
    ): Promise<Result<TOutput, TError>> {
        try {
            return await operation();
        } catch (error) {
            return Result.fail(
                new ValidationError(this.errorMessage, undefined, {
                    originalError: error
                })
            ) as unknown as Result<TOutput, TError>;
        }
    }
}
