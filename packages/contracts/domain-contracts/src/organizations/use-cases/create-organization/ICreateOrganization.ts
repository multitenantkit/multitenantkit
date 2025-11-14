import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { CreateOrganizationInput, CreateOrganizationOutput } from './';

/**
 * CreateOrganization use case port
 */
export interface ICreateOrganization {
    execute(
        input: CreateOrganizationInput,
        context: OperationContext
    ): Promise<IResult<CreateOrganizationOutput, IDomainError>>;
}
