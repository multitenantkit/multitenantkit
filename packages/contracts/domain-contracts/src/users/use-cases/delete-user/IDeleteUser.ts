import type { IUseCase, IDomainError } from '../../../shared';
import type { DeleteUserInput } from './DeleteUser.dto';
import type { User } from '../../entities';

/**
 * DeleteUser use case port
 *
 * Soft deletes a user by setting the deletedAt timestamp and returns the deleted user
 */
export type IDeleteUser = IUseCase<DeleteUserInput, User, IDomainError>;
