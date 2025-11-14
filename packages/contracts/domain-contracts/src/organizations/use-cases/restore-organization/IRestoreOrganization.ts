import type { IDomainError, IUseCase } from '../../../shared';
import type { Organization } from '../../entities';
import type { RestoreOrganizationInput } from './RestoreOrganization.dto';

export * from './RestoreOrganization.dto';

/**
 * RestoreOrganization use case port
 *
 * Restores a soft-deleted organization by clearing the deletedAt timestamp and returns the restored organization.
 * Only the organization owner can restore a organization, and the owner must be an active user.
 *
 * Memberships are NOT modified during restore:
 * - Active memberships (deletedAt=null) will automatically become active again
 * - Deleted memberships (deletedAt set) remain deleted
 * - Left memberships (leftAt set) remain as historical records
 */
export type IRestoreOrganization = IUseCase<RestoreOrganizationInput, Organization, IDomainError>;
