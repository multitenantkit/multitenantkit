import type { IResult, OperationContext, IDomainError } from '../../../shared';
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
