import type { IUseCase, IDomainError } from '../../../shared';
import type { 
    AcceptOrganizationInvitationInput, 
    AcceptOrganizationInvitationOutput 
} from './AcceptOrganizationInvitation.dto';

/**
 * AcceptOrganizationInvitation use case port
 * 
 * Allows a registered user to accept a pending invitation to an organization.
 * This updates the membership with userId and joinedAt timestamp.
 */
export type IAcceptOrganizationInvitation = IUseCase<
    AcceptOrganizationInvitationInput, 
    AcceptOrganizationInvitationOutput, 
    IDomainError
>;
