// Users use cases

// Memberships use cases
import {
    AcceptOrganizationInvitation,
    AddOrganizationMember,
    LeaveOrganization,
    RemoveOrganizationMember,
    UpdateOrganizationMemberRole
} from '@multitenantkit/domain/organization-memberships';

// Organizations use cases
import {
    ArchiveOrganization,
    CreateOrganization,
    DeleteOrganization,
    GetOrganization,
    ListOrganizationMembers,
    RestoreOrganization,
    TransferOrganizationOwnership,
    UpdateOrganization
} from '@multitenantkit/domain/organizations';
import {
    CreateUser,
    DeleteUser,
    GetUser,
    ListUserOrganizations,
    UpdateUser
} from '@multitenantkit/domain/users';
import type {
    Adapters,
    FrameworkConfig,
    MembershipUseCases,
    OrganizationUseCases,
    UseCases,
    UserUseCases
} from '@multitenantkit/domain-contracts';

/**
 * Factory function to create user use cases
 *
 * @param adapters - Application adapters (repositories, UoW, etc.)
 * @param frameworkConfig - Optional framework configuration with custom schemas
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository
 */
function createUserUseCases<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    adapters: Adapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): UserUseCases {
    return {
        createUser: new CreateUser<TUserCustomFields>(adapters as any),
        getUser: new GetUser<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        updateUser: new UpdateUser<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        listUserOrganizations: new ListUserOrganizations<TUserCustomFields>(
            adapters as any,
            frameworkConfig as any
        ),
        deleteUser: new DeleteUser<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig)
    };
}

/**
 * Factory function to create organization use cases
 *
 * @param adapters - Application adapters (repositories, UoW, etc.)
 * @param frameworkConfig - Optional framework configuration with custom schemas
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository
 */
function createOrganizationUseCases<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    adapters: Adapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): OrganizationUseCases {
    return {
        createOrganization: new CreateOrganization<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        getOrganization: new GetOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        updateOrganization: new UpdateOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        listOrganizationMembers: new ListOrganizationMembers(
            adapters as any,
            frameworkConfig as any
        ),
        deleteOrganization: new DeleteOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        archiveOrganization: new ArchiveOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        restoreOrganization: new RestoreOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        transferOrganizationOwnership: new TransferOrganizationOwnership<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig)
    };
}

/**
 * Factory function to create membership use cases
 *
 * @param adapters - Application adapters (repositories, UoW, etc.)
 * @param frameworkConfig - Optional framework configuration with custom schemas
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository
 */
function createMembershipUseCases<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    adapters: Adapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): MembershipUseCases {
    // Future: Extract membership custom schema from framework config if needed
    // const customSchema = frameworkConfig?.organizationMemberships?.customFields?.customSchema;
    return {
        addOrganizationMember: new AddOrganizationMember<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        acceptOrganizationInvitation: new AcceptOrganizationInvitation<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig),
        removeOrganizationMember: new RemoveOrganizationMember(adapters as any),
        updateOrganizationMemberRole: new UpdateOrganizationMemberRole(adapters as any),
        leaveOrganization: new LeaveOrganization<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, frameworkConfig)
    };
}

/**
 * Factory function to create all use cases
 *
 * @param adapters - Application adapters (repositories, UoW, etc.)
 * @param frameworkConfig - Optional framework configuration with custom schemas
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for OrganizationRepository
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMembershipRepository
 */
export function createUseCases<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    adapters: Adapters<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): UseCases {
    return {
        users: createUserUseCases(adapters, frameworkConfig),
        organizations: createOrganizationUseCases(adapters, frameworkConfig),
        memberships: createMembershipUseCases(adapters, frameworkConfig)
        // workflows: createWorkflowUseCases(adapters)
    };
}
