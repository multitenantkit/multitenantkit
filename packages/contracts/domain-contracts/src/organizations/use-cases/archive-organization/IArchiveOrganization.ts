import type { IDomainError, IUseCase } from '../../../shared';
import type { Organization } from '../../entities';
import type { ArchiveOrganizationInput } from './ArchiveOrganization.dto';

/**
 * ArchiveOrganization use case port
 *
 * Archives an organization by setting the archivedAt timestamp
 * Only organization owners or admins can archive an organization
 * Archived organizations can be restored later
 */
export type IArchiveOrganization = IUseCase<ArchiveOrganizationInput, Organization, IDomainError>;
