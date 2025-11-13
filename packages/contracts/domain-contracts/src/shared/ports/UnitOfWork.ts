import type { UserRepository } from "../../users";
import type { OrganizationRepository } from "../../organizations";
import type { OrganizationMembershipRepository } from "../../organization-memberships";

/**
 * Bundle of all repositories available within a transaction
 * Add new repositories here as domain grows
 * 
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository
 */
export interface RepositoryBundle<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
> {
    users: UserRepository<TUserCustomFields>;
    organizations: OrganizationRepository<TOrganizationCustomFields>;
    organizationMemberships: OrganizationMembershipRepository<TUserCustomFields, TOrganizationCustomFields, TOrganizationMembershipCustomFields>;
}

/**
 * Unit of Work pattern for managing transactions
 * Ensures atomicity across multiple repository operations
 * 
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository (future)
 */
export interface UnitOfWork<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
> {
    transaction<T>(work: (repos: RepositoryBundle<TUserCustomFields, TOrganizationCustomFields, TOrganizationMembershipCustomFields>) => Promise<T>): Promise<T>;
}
