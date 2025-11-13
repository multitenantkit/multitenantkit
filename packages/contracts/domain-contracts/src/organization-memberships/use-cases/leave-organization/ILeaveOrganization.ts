import type { IResult, OperationContext, IDomainError } from '../../../shared';
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
