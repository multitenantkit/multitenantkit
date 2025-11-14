import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { UpdateOrganizationInput, UpdateOrganizationOutput } from '.';

/**
 * UpdateOrganization use case port
 */
export interface IUpdateOrganization {
    execute(
        input: UpdateOrganizationInput,
        context: OperationContext
    ): Promise<IResult<UpdateOrganizationOutput, IDomainError>>;
}
