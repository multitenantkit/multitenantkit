import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { GetOrganizationInput, GetOrganizationOutput } from './';

/**
 * GetOrganization use case port
 */
export interface IGetOrganization {
    execute(
        input: GetOrganizationInput,
        context: OperationContext
    ): Promise<IResult<GetOrganizationOutput, IDomainError>>;
}
