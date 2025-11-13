import type { HookContext } from './HookContext';
import type { IResult } from '../results/Result';

/**
 * Hooks available for a use case
 * All hooks are optional and can throw errors to abort execution
 *
 * Lifecycle order:
 * 1. onStart (before validation)
 * 2. afterValidation (after input validation succeeds)
 * 3. beforeExecution (after authorization succeeds, before business logic)
 * 4. afterExecution (after business logic succeeds)
 * 5. onError (if any error occurs)
 * 6. onAbort (if abort() is called)
 * 7. onFinally (always executes)
 *
 * @template TInput - Input type for the use case
 * @template TOutput - Output type for the use case
 * @template TError - Error type for the use case
 * @template TUserCustomFields - Custom fields for User entities
 * @template TOrganizationCustomFields - Custom fields for Organization entities
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembership entities
 */
export interface UseCaseHooks<
    TInput = any,
    TOutput = any,
    TError = any,
    TUserCustomFields = any,
    TOrganizationCustomFields = any,
    TOrganizationMembershipCustomFields = any
> {
    /**
     * Executed at the start, before input validation
     *
     * Use cases:
     * - Initial logging and tracking
     * - Rate limiting checks
     * - Feature flag checks
     * - Circuit breaker checks
     * - Input enrichment preparation
     *
     * Available in context:
     * - input: Original raw input
     * - adapters: Full access to adapters
     * - abort(): Gracefully abort execution
     *
     * If this hook throws an error, execution is aborted and onError is triggered
     *
     * @example
     * ```typescript
     * onStart: async ({ input, context, shared, adapters, abort }) => {
     *     // Track execution start time
     *     shared.startTime = Date.now();
     *     console.log(`Starting ${context.useCaseName}`, input);
     *
     *     // Rate limiting check
     *     const attempts = await rateLimiter.getAttempts(context.actorUserId);
     *     if (attempts > 5) {
     *         abort('Rate limit exceeded: too many requests');
     *     }
     * }
     * ```
     */
    onStart?: (
        ctx: HookContext<
            TInput,
            TOutput,
            TError,
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) => Promise<void> | void;

    /**
     * Executed after input validation succeeds
     *
     * Use cases:
     * - Additional custom validations beyond schema
     * - Business rule checks
     * - Data enrichment post-validation
     * - Complex cross-field validations
     *
     * Available in context:
     * - input: Original raw input (readonly)
     * - stepResults.validatedInput: Validated and potentially transformed input (readonly)
     * - adapters: Full access to adapters
     * - abort(): Gracefully abort execution
     *
     * If this hook throws an error, execution is aborted and onError is triggered
     *
     * @example
     * ```typescript
     * afterValidation: async ({ stepResults, shared, adapters, abort }) => {
     *     const validatedInput = stepResults.validatedInput!;
     *
     *     // Custom validation using adapters
     *     const emailDomain = validatedInput.email.split('@')[1];
     *     const blockedDomains = ['spam.com', 'fake.com'];
     *
     *     if (blockedDomains.includes(emailDomain)) {
     *         shared.blockedDomain = emailDomain;
     *         throw new ValidationError(`Domain ${emailDomain} is not allowed`);
     *     }
     *
     *     // Check user quota
     *     const user = await adapters.persistence.userRepository.findById(validatedInput.userId);
     *     if (user.quotaExceeded) {
     *         abort('User quota exceeded');
     *     }
     * }
     * ```
     */
    afterValidation?: (
        ctx: HookContext<
            TInput,
            TOutput,
            TError,
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) => Promise<void> | void;

    /**
     * Executed after authorization succeeds, before business logic execution
     *
     * This is the last hook before the main business logic runs.
     * Perfect for final checks, audit logging, or preparing data.
     *
     * Use cases:
     * - Logging successful authorization
     * - Recording audit information
     * - Pre-execution checks (quota, feature flags)
     * - Final validations before execution
     * - Preparing shared data for business logic
     *
     * Available in context:
     * - input: Original raw input (readonly)
     * - stepResults.validatedInput: Validated input (readonly)
     * - stepResults.authorized: Authorization status (readonly)
     * - adapters: Full access to adapters
     * - abort(): Gracefully abort execution
     *
     * If this hook throws an error, execution is aborted and onError is triggered
     *
     * @example
     * ```typescript
     * beforeExecution: async ({ stepResults, context, adapters, abort }) => {
     *     const validatedInput = stepResults.validatedInput!;
     *
     *     // Log authorization success for audit
     *     await adapters.observability?.logHookExecution({
     *         requestId: context.requestId,
     *         useCaseName: 'UpdateUser',
     *         hookName: 'beforeExecution',
     *         executionId: context.executionId,
     *         timestamp: new Date(),
     *         params: { userId: context.actorUserId, action: 'authorized' }
     *     });
     *
     *     // Check quota before execution
     *     const userQuota = await quotaService.getQuota(context.actorUserId);
     *     if (userQuota.exceeded) {
     *         abort('User quota exceeded');
     *     }
     * }
     * ```
     */
    beforeExecution?: (
        ctx: HookContext<
            TInput,
            TOutput,
            TError,
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) => Promise<void> | void;

    /**
     * Executed after business logic executes successfully
     *
     * Use cases:
     * - Side effects (send emails, notifications, webhooks)
     * - Output analysis
     * - Post-processing
     * - Triggering dependent workflows
     * - Updating caches
     *
     * Available in context:
     * - input: Original raw input (readonly)
     * - stepResults.validatedInput: Validated input (readonly)
     * - stepResults.output: Business logic output (readonly)
     * - adapters: Full access to adapters
     * - abort(): Gracefully abort execution (rare, but possible)
     *
     * If this hook throws an error, execution is aborted and onError is triggered.
     * To prevent abortion on side effect failures, wrap in try/catch.
     *
     * @example
     * ```typescript
     * afterExecution: async ({ stepResults, adapters, shared }) => {
     *     const output = stepResults.output!;
     *
     *     // Side effect that should NOT abort on failure
     *     try {
     *         await emailService.sendWelcome({
     *             to: output.email,
     *             name: output.name
     *         });
     *         shared.emailSent = true;
     *     } catch (error) {
     *         console.error('Failed to send welcome email:', error);
     *         shared.emailSent = false;
     *         // Error is caught, execution continues
     *     }
     *
     *     // Trigger webhook (fire-and-forget)
     *     webhookService.trigger('user.created', output).catch(console.error);
     * }
     * ```
     */
    afterExecution?: (
        ctx: HookContext<
            TInput,
            TOutput,
            TError,
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) => Promise<void> | void;

    /**
     * Executed when an error occurs in any step
     *
     * Use cases:
     * - Error logging with context
     * - Error notifications
     * - Error recovery attempts
     * - Rollback operations
     * - Alert critical errors
     *
     * Available in context (via parameter):
     * - error: The error that occurred
     * - input: Original raw input (readonly)
     * - stepResults: Results from steps that completed before error (readonly)
     * - adapters: Full access to adapters
     * - shared: Shared state accumulated before error
     *
     * If this hook throws an error, it replaces the original error
     *
     * @example
     * ```typescript
     * onError: async ({ error, shared, context, adapters }) => {
     *     // Log error with full context
     *     console.error('Use case failed', {
     *         useCaseName: context.useCaseName,
     *         executionId: context.executionId,
     *         error: error.message,
     *         shared
     *     });
     *
     *     // Send alert for critical infrastructure errors
     *     if (error instanceof InfrastructureError) {
     *         await alertService.sendCriticalAlert({
     *             service: 'MultiTenantKit',
     *             error: error.message,
     *             context: context.requestId
     *         });
     *     }
     * }
     * ```
     */
    onError?: (
        ctx: HookContext<
            TInput,
            TOutput,
            TError,
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        > & { error: TError }
    ) => Promise<void> | void;

    /**
     * Executed when execution is gracefully aborted via abort()
     *
     * This hook is triggered when any hook calls ctx.abort(reason).
     * It allows you to handle aborted executions differently from errors.
     *
     * Use cases:
     * - Log abort reason
     * - Record metrics for aborted operations
     * - Clean up resources
     * - Notify monitoring systems
     * - Different handling than errors (e.g., no alerts for rate limits)
     *
     * Available in context (via parameter):
     * - reason: The reason provided to abort()
     * - input: Original raw input (readonly)
     * - stepResults: Results from steps that completed before abort (readonly)
     * - adapters: Full access to adapters
     * - shared: Shared state accumulated before abort
     *
     * Errors thrown in this hook are caught and logged but don't affect the abort
     *
     * @example
     * ```typescript
     * onAbort: async ({ reason, shared, context, adapters }) => {
     *     // Log abort with context
     *     console.log('Use case aborted', {
     *         useCaseName: context.useCaseName,
     *         executionId: context.executionId,
     *         reason,
     *         duration: Date.now() - shared.startTime
     *     });
     *
     *     // Record metrics (different from errors)
     *     await adapters.observability?.logHookExecution({
     *         requestId: context.requestId,
     *         useCaseName: context.useCaseName,
     *         hookName: 'onAbort',
     *         executionId: context.executionId,
     *         timestamp: new Date(),
     *         params: { reason, aborted: true }
     *     });
     * }
     * ```
     */
    onAbort?: (
        ctx: HookContext<
            TInput,
            TOutput,
            TError,
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        > & { reason: string }
    ) => Promise<void> | void;

    /**
     * Executed always at the end (success, error, or abort)
     * Similar to a finally block
     *
     * Use cases:
     * - Logging completion
     * - Metrics recording (duration, success rate)
     * - Cleanup operations
     * - Resource release
     * - Performance tracking
     *
     * Available in context (via parameter):
     * - result: The final Result object (success or failure)
     * - input: Original raw input (readonly)
     * - stepResults: All step results (readonly)
     * - adapters: Full access to adapters
     * - shared: All shared state
     *
     * Errors thrown here are caught and logged but don't affect the result
     *
     * @example
     * ```typescript
     * onFinally: async ({ result, shared, context, adapters }) => {
     *     const duration = Date.now() - shared.startTime;
     *
     *     // Record metrics
     *     await adapters.observability?.logHookExecution({
     *         requestId: context.requestId,
     *         useCaseName: context.useCaseName,
     *         hookName: 'onFinally',
     *         executionId: context.executionId,
     *         timestamp: new Date(),
     *         params: {
     *             duration,
     *             success: result.isSuccess,
     *             emailSent: shared.emailSent
     *         }
     *     });
     *
     *     // Log completion
     *     console.log(`${context.useCaseName} completed in ${duration}ms`);
     * }
     * ```
     */
    onFinally?: (
        ctx: HookContext<
            TInput,
            TOutput,
            TError,
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        > & { result: IResult<TOutput, TError> }
    ) => Promise<void> | void;
}
