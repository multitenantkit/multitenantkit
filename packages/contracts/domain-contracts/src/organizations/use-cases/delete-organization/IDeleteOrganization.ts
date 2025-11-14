import type { IDomainError, IUseCase } from '../../../shared';
import type { Organization } from '../../entities';
import type { DeleteOrganizationInput } from './DeleteOrganization.dto';

/**
 * DeleteOrganization use case port
 *
 * Soft deletes a organization by setting the deletedAt timestamp and returns the deleted organization
 */
export type IDeleteOrganization = IUseCase<DeleteOrganizationInput, Organization, IDomainError>;
