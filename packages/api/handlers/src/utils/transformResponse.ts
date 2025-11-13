import type {
    ResponseTransformer,
    ResponseTransformerContext
} from '@multitenantkit/domain-contracts/shared/config/ResponseTransformer';

/**
 * Applies a response transformer to an HTTP response if one is configured
 * 
 * This utility provides fail-safe transformation of HTTP responses:
 * - If no transformer is provided, returns the original response unchanged
 * - If transformer is provided, invokes it with full context
 * - If transformer throws an error, logs it and returns original response (fail-safe)
 * 
 * The fail-safe behavior ensures that transformation errors don't break the API.
 * Errors are logged for debugging but don't affect the client response.
 * 
 * @template TInput - Type of the use case input
 * @template TOutput - Type of the use case output (domain entity)
 * 
 * @param context - Full context including request, response, and use case result
 * @param transformer - Optional transformer function to apply
 * @returns Transformed response or original response if no transformer or on error
 * 
 * @example
 * ```typescript
 * // In a handler
 * const baseResponse = {
 *     status: 200,
 *     body: ResponseBuilder.success(userData, requestId),
 *     headers: { 'X-Request-ID': requestId }
 * };
 * 
 * const transformer = frameworkConfig?.responseTransformers?.users?.GetUser;
 * return applyResponseTransformer(
 *     {
 *         request: { input, principal, requestId },
 *         response: baseResponse,
 *         useCaseResult: result
 *     },
 *     transformer
 * );
 * ```
 */
export async function applyResponseTransformer<TInput = any, TOutput = any>(
    context: ResponseTransformerContext<TInput, TOutput>,
    transformer?: ResponseTransformer<TInput, TOutput>
): Promise<{
    status: number;
    body: any;
    headers?: Record<string, string>;
}> {
    // If no transformer configured, return original response
    if (!transformer) {
        return context.response;
    }

    try {
        // Apply transformation
        const transformedResponse = await transformer(context);

        // Ensure transformed response has required fields
        if (!transformedResponse || typeof transformedResponse.status !== 'number') {
            console.error(
                '[ResponseTransformer] Invalid transformer output - missing status code. Returning original response.',
                {
                    requestId: context.request.requestId,
                    hasTransformedResponse: !!transformedResponse
                }
            );
            return context.response;
        }

        return transformedResponse;
    } catch (error) {
        // Log error but don't break the request - return original response (fail-safe)
        console.error('[ResponseTransformer] Transformer execution failed. Returning original response.', {
            requestId: context.request.requestId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });

        return context.response;
    }
}
