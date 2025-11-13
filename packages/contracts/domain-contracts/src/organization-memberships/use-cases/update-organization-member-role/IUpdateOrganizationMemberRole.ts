import type { IResult, OperationContext, IDomainError } from '../../../shared';
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
