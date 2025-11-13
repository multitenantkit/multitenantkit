export { Result, Ok, Fail } from './Result';

// Type aliases for convenience
import { Result } from './Result';
export type Either<E, T> = Result<T, E>;
