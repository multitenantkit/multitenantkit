import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { ListOrganizationMembersInput, ListOrganizationMembersOutput } from './';

/**
 * ListOrganizationMembers use case port
 */
export interface IListOrganizationMembers {
    execute(
        input: ListOrganizationMembersInput,
        context: OperationContext
    ): Promise<IResult<ListOrganizationMembersOutput, IDomainError>>;
}
