import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { UpdateOrganizationMemberRoleInput, UpdateOrganizationMemberRoleOutput } from './';

/**
 * UpdateOrganizationMemberRole use case port
 */
export interface IUpdateOrganizationMemberRole {
    execute(
        input: UpdateOrganizationMemberRoleInput,
        context: OperationContext
    ): Promise<IResult<UpdateOrganizationMemberRoleOutput, IDomainError>>;
}
