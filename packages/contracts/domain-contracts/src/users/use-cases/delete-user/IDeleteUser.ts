import type { IDomainError, IUseCase } from '../../../shared';
import type { User } from '../../entities';
import type { DeleteUserInput } from './DeleteUser.dto';

/**
 * DeleteUser use case port
 *
 * Soft deletes a user by setting the deletedAt timestamp and returns the deleted user
 */
export type IDeleteUser = IUseCase<DeleteUserInput, User, IDomainError>;
