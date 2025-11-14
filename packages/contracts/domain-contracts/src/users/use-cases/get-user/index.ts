import type { IDomainError, IUseCase } from '../../../shared';
import type { User } from '../../entities';
import type { GetUserInput } from './GetUser.dto';

export * from './GetUser.dto';

/**
 * GetUser use case port
 *
 * Retrieves a user by their unique ID
 */
export type IGetUser = IUseCase<GetUserInput, User, IDomainError>;
