import type { OrganizationMembershipRepository } from '../../organization-memberships';
import type { OrganizationRepository } from '../../organizations';
import type { UserRepository } from '../../users';
import type { UnitOfWork } from '../ports';
import type { ClockPort } from '../ports/ClockPort';
import type { UuidPort } from '../ports/UuidPort';
import type { MetricsPort } from '../ports/MetricsPort';

/**
 * Bundle of all infrastructure adapters
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository (future)
 */
export interface Adapters<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
> {
    persistence: {
        // Persistence
        uow: UnitOfWork<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >;
        userRepository: UserRepository<TUserCustomFields>;
        organizationRepository: OrganizationRepository<TOrganizationCustomFields>;
        organizationMembershipRepository: OrganizationMembershipRepository<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >;
    };

    // System
    system: {
        clock: ClockPort;
        uuid: UuidPort;
    };

    // Observability (optional)
    observability?: MetricsPort;
}

export interface PersistenceAdapters<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
> {
    uow: UnitOfWork<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
    userRepository: UserRepository<TUserCustomFields>;
    organizationRepository: OrganizationRepository<TOrganizationCustomFields>;
    organizationMembershipRepository: OrganizationMembershipRepository<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >;
}

export interface SystemAdapters {
    clock: ClockPort;
    uuid: UuidPort;
}

export interface ObservabilityAdapters {
    observability?: MetricsPort;
}
