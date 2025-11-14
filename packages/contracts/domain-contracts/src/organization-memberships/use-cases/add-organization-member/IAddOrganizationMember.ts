import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { AddOrganizationMemberInput, AddOrganizationMemberOutput } from './';

/**
 * AddOrganizationMember use case port
 */
export interface IAddOrganizationMember {
    execute(
        input: AddOrganizationMemberInput,
        context: OperationContext
    ): Promise<IResult<AddOrganizationMemberOutput, IDomainError>>;
}
