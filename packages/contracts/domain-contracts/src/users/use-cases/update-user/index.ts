import type { IUseCase, IDomainError } from '../../../shared';
import type { UpdateUserInput } from './UpdateUser.dto';
import type { User } from '../../entities';

export * from './UpdateUser.dto';

/**
 * UpdateUser use case port
 * 
 * Updates a user's profile information and returns the updated user
 */
export type IUpdateUser = IUseCase<UpdateUserInput, User, IDomainError>;
