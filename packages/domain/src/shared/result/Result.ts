/**
 * Result pattern for handling errors in a functional way
 * Based on Railway Oriented Programming
 */

export abstract class Result<T, E> {
    public readonly isSuccess: boolean;
    public readonly isFailure: boolean;

    constructor(isSuccess: boolean) {
        this.isSuccess = isSuccess;
        this.isFailure = !isSuccess;
    }

    public static ok<U>(value: U): Ok<U, never> {
        return new Ok(value);
    }

    public static fail<F>(error: F): Fail<never, F> {
        return new Fail(error);
    }

    public abstract getValue(): T;
    public abstract getError(): E;

    public map<U>(fn: (value: T) => U): Result<U, E> {
        if (this.isFailure) {
            return Result.fail(this.getError());
        }
        return Result.ok(fn(this.getValue()));
    }

    public mapError<F>(fn: (error: E) => F): Result<T, F> {
        if (this.isSuccess) {
            return Result.ok(this.getValue());
        }
        return Result.fail(fn(this.getError()));
    }

    public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        if (this.isFailure) {
            return Result.fail(this.getError());
        }
        return fn(this.getValue());
    }

    public match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
        if (this.isSuccess) {
            return onSuccess(this.getValue());
        }
        return onFailure(this.getError());
    }
}

export class Ok<T, E> extends Result<T, E> {
    private readonly _value: T;

    constructor(value: T) {
        super(true);
        this._value = value;
    }

    public getValue(): T {
        return this._value;
    }

    public getError(): E {
        throw new Error('Cannot get error from Ok result');
    }
}

export class Fail<T, E> extends Result<T, E> {
    private readonly _error: E;

    constructor(error: E) {
        super(false);
        this._error = error;
    }

    public getValue(): T {
        throw new Error('Cannot get value from Fail result');
    }

    public getError(): E {
        return this._error;
    }
}
