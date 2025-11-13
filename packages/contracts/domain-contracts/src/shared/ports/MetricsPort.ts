/**
 * Port for metrics and observability logging
 * Allows pluggable implementations (HTTP API, custom endpoints, etc.)
 *
 * Fire-and-forget pattern - errors are silently handled
 */
export interface MetricsPort {
    /**
     * Log hook execution for observability and metrics collection
     * This is fire-and-forget - implementation should not throw
     *
     * @param payload Hook execution parameters including context and metadata
     */
    logHookExecution(payload: {
        requestId: string;
        useCaseName: string;
        hookName: string;
        executionId: string;
        timestamp: Date;
        params: any; // Hook context - type varies per hook
        [key: string]: any; // Allow additional metadata
    }): Promise<void>;
}
