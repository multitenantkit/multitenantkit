import type { IDomainError, IResult, OperationContext } from '../../../shared';
import type { LeaveOrganizationInput, LeaveOrganizationOutput } from './';

/**
 * LeaveOrganization use case port
 */
export interface ILeaveOrganization {
    execute(
        input: LeaveOrganizationInput,
        context: OperationContext
    ): Promise<IResult<LeaveOrganizationOutput, IDomainError>>;
}
