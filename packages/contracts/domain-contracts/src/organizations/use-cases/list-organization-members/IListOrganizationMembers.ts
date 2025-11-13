import type { IResult, OperationContext, IDomainError } from '../../../shared';
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
