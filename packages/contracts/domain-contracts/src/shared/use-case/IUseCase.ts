import type { IResult, OperationContext, IDomainError } from '../';

/**
 * Generic interface for all use cases
 * 
 * Provides a consistent contract across all domain use cases:
 * - All use cases have an execute method
 * - All accept input and operation context
 * - All return Result with output or domain error
 * 
 * @template TInput - Input type for the use case
 * @template TOutput - Output type returned by the use case
 * @template TError - Domain error types that can be returned (defaults to IDomainError)
 * 
 * @example
 * ```typescript
 * // Define specific use case type
 * export type IGetUser = IUseCase<GetUserInput, User, DomainError>;
 * 
 * // Or extend for additional documentation
 * export interface IGetUser extends IUseCase<GetUserInput, User, DomainError> {}
 * ```
 */
export interface IUseCase<
    TInput,
    TOutput,
    TError extends IDomainError = IDomainError
> {
    execute(
        input: TInput,
        context: OperationContext
    ): Promise<IResult<TOutput, TError>>;
}
