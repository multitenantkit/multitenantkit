import type { IResult, OperationContext, IDomainError } from '../../../shared';
import type { RemoveOrganizationMemberInput, RemoveOrganizationMemberOutput } from './';

/**
 * RemoveOrganizationMember use case port
 */
export interface IRemoveOrganizationMember {
    execute(
        input: RemoveOrganizationMemberInput,
        context: OperationContext
    ): Promise<IResult<RemoveOrganizationMemberOutput, IDomainError>>;
}
