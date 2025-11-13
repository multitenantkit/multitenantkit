import type { IUseCase, IDomainError } from '../../../shared';
import type { ArchiveOrganizationInput } from './ArchiveOrganization.dto';
import type { Organization } from '../../entities';

/**
 * ArchiveOrganization use case port
 * 
 * Archives an organization by setting the archivedAt timestamp
 * Only organization owners or admins can archive an organization
 * Archived organizations can be restored later
 */
export type IArchiveOrganization = IUseCase<ArchiveOrganizationInput, Organization, IDomainError>;
