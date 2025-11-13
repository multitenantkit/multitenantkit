/**
 * Result type for use case operations
 * Represents either a success with a value or a failure with an error
 */
export interface IResult<T, E = Error> {
    isSuccess: boolean;
    isFailure: boolean;
    getValue(): T;
    getError(): E;
}
