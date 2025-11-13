/**
 * Context shared between hooks during the execution of a use case
 * Allows passing data between hooks and accessing results from previous steps
 */
export interface HookExecutionContext {
    /**
     * Unique execution ID for tracking
     * Generated at the start of use case execution
     */
    executionId: string;

    /**
     * Name of the use case being executed
     * Matches the class name (e.g., 'CreateUser', 'GetOrganization')
     */
    useCaseName: string;

    /**
     * Shared data between hooks (any hook can read/write)
     * Use this to pass information between different hooks in the pipeline
     * 
     * Example:
     * ```typescript
     * onStart: ({ hookContext }) => {
     *     hookContext.shared.startTime = Date.now();
     * },
     * onFinally: ({ hookContext }) => {
     *     const duration = Date.now() - hookContext.shared.startTime;
     *     console.log(`Execution took ${duration}ms`);
     * }
     * ```
     */
    shared: Record<string, any>;

    /**
     * Results from previous pipeline steps
     * Each step populates its result here for subsequent hooks to access
     */
    stepResults: {
        /**
         * Validated input (available after validateInput step)
         */
        validatedInput?: any;

        /**
         * Authorization result (available after authorize step)
         */
        authorized?: boolean;

        /**
         * Business logic output (available after executeBusinessLogic step)
         */
        businessOutput?: any;
    };
}
