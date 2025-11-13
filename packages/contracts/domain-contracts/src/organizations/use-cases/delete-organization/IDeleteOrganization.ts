import type { IUseCase, IDomainError } from '../../../shared';
import type { DeleteOrganizationInput } from './DeleteOrganization.dto';
import type { Organization } from '../../entities';

/**
 * DeleteOrganization use case port
 * 
 * Soft deletes a organization by setting the deletedAt timestamp and returns the deleted organization
 */
export type IDeleteOrganization = IUseCase<DeleteOrganizationInput, Organization, IDomainError>;

