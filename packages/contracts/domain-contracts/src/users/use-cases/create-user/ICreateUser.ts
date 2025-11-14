import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { CreateUserInput, CreateUserOutput } from './';

/**
 * CreateUser use case port
 */
export interface ICreateUser {
    execute(
        input: CreateUserInput,
        context: OperationContext
    ): Promise<IResult<CreateUserOutput, IDomainError>>;
}
