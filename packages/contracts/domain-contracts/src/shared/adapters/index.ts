import type { OrganizationMembershipRepository } from '../../organization-memberships';
import type { OrganizationRepository } from '../../organizations';
import type { UserRepository } from '../../users';
import type { UnitOfWork } from '../ports';
import type { ClockPort } from '../ports/ClockPort';
import type { MetricsPort } from '../ports/MetricsPort';
import type { UuidPort } from '../ports/UuidPort';

/**
 * Bundle of all infrastructure adapters
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository (future)
 */
export interface Adapters<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
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
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
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
