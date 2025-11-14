import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { ListUserOrganizationsInput, ListUserOrganizationsOutput } from './';

/**
 * ListUserOrganizations use case port
 */
export interface IListUserOrganizations {
    execute(
        input: ListUserOrganizationsInput,
        context: OperationContext
    ): Promise<IResult<ListUserOrganizationsOutput, IDomainError>>;
}
