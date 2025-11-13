import type { IResult, OperationContext, IDomainError } from '../../../shared';
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
