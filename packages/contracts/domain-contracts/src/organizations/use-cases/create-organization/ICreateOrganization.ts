import type { IResult, OperationContext, IDomainError } from '../../../shared';
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
