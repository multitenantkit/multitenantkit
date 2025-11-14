import type { IDomainError, IUseCase } from '../../../shared';
import type { User } from '../../entities';
import type { UpdateUserInput } from './UpdateUser.dto';

export * from './UpdateUser.dto';

/**
 * UpdateUser use case port
 *
 * Updates a user's profile information and returns the updated user
 */
export type IUpdateUser = IUseCase<UpdateUserInput, User, IDomainError>;
