/**
 * Base interface for domain errors
 * All domain errors should implement this interface
 */
export interface IDomainError {
    readonly name: string;
    readonly message: string;
    readonly code?: string;
    readonly details?: Record<string, unknown>;
}
