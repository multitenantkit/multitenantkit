import type { Adapters } from '../adapters';
import type { OperationContext } from '../OperationContext';

/**
 * Unified context object provided to all hooks during use case execution
 *
 * This context provides:
 * - Execution tracking (executionId, useCaseName)
 * - Immutable access to input and step results
 * - Shared mutable state between hooks
 * - Full access to infrastructure adapters
 * - Graceful abort mechanism
 *
 * @template TInput - Input type for the use case
 * @template TOutput - Output type for the use case
 * @template TError - Error type for the use case
 * @template TUserCustomFields - Custom fields for User entities
 * @template TOrganizationCustomFields - Custom fields for Organization entities
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembership entities
 *
 * @example
 * ```typescript
 * // In a hook configuration
 * afterValidation: (ctx) => {
 *   // Access immutable data
 *   console.log('Input:', ctx.input);
 *   console.log('Validated:', ctx.stepResults.validatedInput);
 *
 *   // Share data with other hooks
 *   ctx.shared.customData = 'some value';
 *
 *   // Use adapters for operations
 *   const user = await ctx.adapters.persistence.userRepository.findById(userId);
 *
 *   // Abort execution gracefully
 *   if (someCondition) {
 *     ctx.abort('Rate limit exceeded');
 *   }
 * }
 * ```
 */
export interface HookContext<
    TInput = any,
    TOutput = any,
    TUserCustomFields = any,
    TOrganizationCustomFields = any,
    TOrganizationMembershipCustomFields = any
> {
    /**
     * Unique execution ID for tracking this specific use case execution
     * Generated at the start of use case execution
     * Useful for correlating logs and metrics
     */
    readonly executionId: string;

    /**
     * Name of the use case being executed
     * Format: "entity-useCaseName" (e.g., 'user-createUser', 'organization-updateOrganization')
     */
    readonly useCaseName: string;

    /**
     * Original input provided to the use case (immutable)
     * This is the raw input before any validation or transformation
     *
     * @readonly - Cannot be modified by hooks
     */
    readonly input: TInput;

    /**
     * Results from previous pipeline steps (immutable)
     * Each step populates its result here for subsequent hooks to access
     *
     * Available results depend on which hook is executing:
     * - onStart: none
     * - afterValidation: validatedInput
     * - beforeExecution: validatedInput, authorized
     * - afterExecution: validatedInput, authorized, output
     * - onError: varies depending on where error occurred
     * - onFinally: all available
     *
     * @readonly - Cannot be modified by hooks
     */
    readonly stepResults: {
        /**
         * Validated input (available after validateInput step)
         * This is the input after Zod schema validation
         */
        validatedInput?: TInput;

        /**
         * Authorization result (available after authorize step)
         * True if authorization succeeded, undefined if not yet checked
         */
        authorized?: boolean;

        /**
         * Business logic output (available after executeBusinessLogic step)
         * This is the raw output before final parsing
         */
        output?: TOutput;
    };

    /**
     * Shared mutable state between hooks
     * Use this to pass information between different hooks in the pipeline
     *
     * This is the ONLY mutable part of the context, allowing hooks to:
     * - Store computed values for later hooks
     * - Pass metadata between hooks
     * - Store timing information
     *
     * @example
     * ```typescript
     * onStart: ({ shared }) => {
     *   shared.startTime = Date.now();
     * },
     * onFinally: ({ shared }) => {
     *   const duration = Date.now() - shared.startTime;
     *   console.log(`Execution took ${duration}ms`);
     * }
     * ```
     */
    shared: Record<string, any>;

    /**
     * Full access to infrastructure adapters
     * Allows hooks to perform complex operations like:
     * - Query repositories
     * - Generate IDs or timestamps
     * - Log metrics
     *
     * Available adapters:
     * - persistence: { uow, userRepository, organizationRepository, organizationMembershipRepository }
     * - system: { clock, uuid }
     * - observability: { logHookExecution } (optional)
     *
     * @example
     * ```typescript
     * afterValidation: async ({ adapters, input }) => {
     *   // Check user exists
     *   const user = await adapters.persistence.userRepository.findById(input.userId);
     *   if (!user) {
     *     throw new NotFoundError('User', input.userId);
     *   }
     *
     *   // Check custom business rule
     *   if (user.lastBookingDate) {
     *     const daysSinceBooking = adapters.system.clock.now().getTime() - user.lastBookingDate.getTime();
     *     if (daysSinceBooking < 86400000) { // 24 hours
     *       ctx.abort('User must wait 24 hours between bookings');
     *     }
     *   }
     * }
     * ```
     */
    readonly adapters: Adapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;

    /**
     * Operation context for audit logging
     * Contains information about who is performing the operation and in what context
     *
     * Available properties:
     * - requestId: Unique identifier for the request
     * - actorUserId: ID of the user performing the operation
     * - organizationId: ID of the organization context (optional)
     * - metadata: Additional metadata (deviceInfo, ipAddress, userAgent, source)
     * - auditAction: Specific business action being performed (optional)
     */
    readonly context: OperationContext;

    /**
     * Gracefully abort the use case execution
     *
     * When called, this function:
     * 1. Stops the execution pipeline immediately
     * 2. Triggers the onAbort hook (if configured)
     * 3. Returns an AbortedError instead of continuing execution
     *
     * Unlike throwing an error (which triggers onError), abort provides
     * a clean way to stop execution for non-error conditions like:
     * - Rate limiting
     * - Circuit breaker open
     * - Feature flags disabled
     * - Quota exceeded
     * - Custom business rules
     *
     * @param reason - Human-readable reason for aborting (will be included in AbortedError)
     *
     * @example
     * ```typescript
     * afterValidation: async ({ abort, input, adapters }) => {
     *   // Rate limiting check
     *   const attempts = await rateLimiter.getAttempts(input.userId);
     *   if (attempts > 5) {
     *     abort('Rate limit exceeded: too many requests');
     *     return; // abort() doesn't throw, so return to exit hook
     *   }
     * }
     * ```
     */
    abort: (reason: string) => void;
}
