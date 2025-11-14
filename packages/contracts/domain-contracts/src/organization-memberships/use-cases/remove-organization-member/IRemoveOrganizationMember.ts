import type { IDomainError, IResult, OperationContext } from '../../../shared';
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
