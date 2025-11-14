export { Fail, Ok, Result } from './Result';

// Type aliases for convenience
import type { Result } from './Result';
export type Either<E, T> = Result<T, E>;
