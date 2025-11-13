import type { IUseCase, IDomainError } from '../../../shared';
import type {
    TransferOrganizationOwnershipInput,
    TransferOrganizationOwnershipOutput
} from './TransferOrganizationOwnership.dto';

export * from './TransferOrganizationOwnership.dto';

/**
 * TransferOrganizationOwnership use case port
 *
 * Transfers organization ownership from the current owner to a new owner.
 *
 * Business rules:
 * - Only the current owner can transfer ownership
 * - Both current and new owner must be active users (not soft-deleted)
 * - Organization must be active (not soft-deleted)
 * - Both users must have active memberships in the organization (not deleted, not left)
 * - New owner must be different from current owner
 *
 * Effects:
 * - Updates organization.ownerUserId to the new owner
 * - Updates old owner's membership roleCode to 'member'
 * - Updates new owner's membership roleCode to 'owner'
 */
export type ITransferOrganizationOwnership = IUseCase<
    TransferOrganizationOwnershipInput,
    TransferOrganizationOwnershipOutput,
    IDomainError
>;
