import type { MetricsPort } from '@multitenantkit/domain-contracts/shared/ports';

/**
 * Configuration for HTTP Metrics Adapter
 */
export interface HttpMetricsConfig {
    /**
     * API key for authentication with metrics service
     */
    apiKey?: string;

    includeFullContext?: boolean;

    printErrorsToConsole?: boolean;
}

/**
 * HTTP Adapter for Metrics Port
 *
 * Sends metrics to HTTP endpoint
 * Fire-and-forget pattern - never blocks execution
 *
 * @example Default
 * ```typescript
 * const adapter = new HttpMetricsAdapter({
 *   apiKey: 'my-api-key'
 * });
 * ```
 */
export class HttpMetricsAdapter implements MetricsPort {
    private readonly METRICS_ENDPOINT_URL = 'http://localhost:3005/api/v1/metrics/hooks';
    private readonly SDK_VERSION = '1.0.0';

    private config: HttpMetricsConfig;

    constructor(config?: HttpMetricsConfig) {
        this.config = config ?? {};
        if (!this.config.apiKey) {
            if (!process.env.HTTP_METRICS_API_KEY) {
                console.warn('HTTP_METRICS_API_KEY is required');
                return;
            } else {
                this.config.apiKey = process.env.HTTP_METRICS_API_KEY;
            }
        }
    }

    /**
     * Log hook execution to HTTP endpoint
     * Fire-and-forget - never throws, never blocks
     */
    async logHookExecution(payload: {
        requestId: string;
        useCaseName: string;
        hookName: string;
        executionId: string;
        timestamp: Date;
        params: any; // HookContext - type varies per hook
        [key: string]: any;
    }): Promise<void> {
        // If disabled, do nothing
        if (!this.config.apiKey) {
            return;
        }

        try {
            const endpoint = this.METRICS_ENDPOINT_URL;
            const headers = this.buildHeaders();

            const { params, ...rest } = payload;
            const includeFullContext = this.config.includeFullContext ?? false;

            let safeContext;
            if (!includeFullContext) {
                // Extract safe context data (no PII)
                safeContext = this.extractSafeContext(params);
            } else {
                safeContext = params;
            }

            // Fire-and-forget: no await, catch errors silently
            fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...rest,
                    params: safeContext,
                    timestamp: rest.timestamp.toISOString(),
                    sdkVersion: this.SDK_VERSION
                })
            }).catch((error) => {
                // Silent fail - metrics should never break execution
                if (this.config.printErrorsToConsole) {
                    console.warn('[HttpMetricsAdapter] Failed to send metrics:', error.message);
                }
            });
        } catch (error) {
            // Silent fail at any stage
            if (this.config.printErrorsToConsole) {
                console.warn('[HttpMetricsAdapter] Error preparing metrics:', error);
            }
        }
    }

    /**
     * Extract safe context data from hook context
     * Filters out PII and sensitive information
     *
     * @param params - Hook context (can be HookContext or HookContext with extra fields like error, reason, result)
     * @returns Safe context data without PII
     */
    private extractSafeContext(params: any): Record<string, any> {
        const context = params.context;
        const executionId = params.executionId;
        const useCaseName = params.useCaseName;
        const stepResults = params.stepResults;
        const shared = params.shared;

        return {
            // Execution tracking
            executionId,
            useCaseName,

            // Context info (UUIDs only - no PII)
            context: context
                ? {
                      actorUserId: context.actorUserId,
                      organizationId: context.organizationId,
                      auditAction: context.auditAction
                      // Exclude: metadata (may contain PII like IP, userAgent)
                  }
                : undefined,

            // Step results info (metadata only)
            stepResults: stepResults
                ? {
                      stepsCompleted: Object.keys(stepResults).filter((key) => stepResults[key] !== undefined),
                      hasValidatedInput: !!stepResults.validatedInput,
                      hasAuthorized: !!stepResults.authorized,
                      hasOutput: !!stepResults.output
                      // Exclude: actual values (may contain PII)
                  }
                : undefined,

            // Shared state info (keys only)
            shared: shared
                ? {
                      sharedKeys: Object.keys(shared)
                      // Exclude: actual values (may contain sensitive data)
                  }
                : undefined,

            // Include hook-specific fields (error, reason, result) if present
            hasError: !!params.error,
            hasReason: !!params.reason,
            hasResult: !!params.result
        };
    }

    /**
     * Build HTTP headers for the request
     */
    private buildHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': `EasyManagement-SDK/${this.SDK_VERSION}`
        };

        // Add API key if provided (for SaaS)
        if (this.config.apiKey) {
            headers['X-API-Key'] = this.config.apiKey;
        }

        return headers;
    }
}
