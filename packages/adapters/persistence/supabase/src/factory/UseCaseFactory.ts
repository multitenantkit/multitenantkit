/**
 * Use Case Factory for Supabase
 *
 * Creates all use cases with Supabase adapters.
 * This is a copy of the composition package's factory to avoid Node.js dependencies.
 */

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
// Users use cases
import {
    CreateUser,
    DeleteUser,
    GetUser,
    ListUserOrganizations,
    UpdateUser
} from '@multitenantkit/domain/users';

import type {
    Adapters,
    MembershipUseCases,
    OrganizationUseCases,
    ToolkitOptions,
    UseCases,
    UserUseCases
} from '@multitenantkit/domain-contracts';

/**
 * Factory function to create user use cases
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
    toolkitOptions?: ToolkitOptions<
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
        >(adapters as any, toolkitOptions),
        updateUser: new UpdateUser<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions),
        listUserOrganizations: new ListUserOrganizations<TUserCustomFields>(
            adapters as any,
            toolkitOptions as any
        ),
        deleteUser: new DeleteUser<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions)
    };
}

/**
 * Factory function to create organization use cases
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
    toolkitOptions?: ToolkitOptions<
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
        >(adapters as any, toolkitOptions),
        getOrganization: new GetOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions),
        updateOrganization: new UpdateOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions),
        listOrganizationMembers: new ListOrganizationMembers(
            adapters as any,
            toolkitOptions as any
        ),
        deleteOrganization: new DeleteOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions),
        archiveOrganization: new ArchiveOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions),
        restoreOrganization: new RestoreOrganization<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions),
        transferOrganizationOwnership: new TransferOrganizationOwnership<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions)
    };
}

/**
 * Factory function to create membership use cases
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
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): MembershipUseCases {
    return {
        addOrganizationMember: new AddOrganizationMember<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions),
        acceptOrganizationInvitation: new AcceptOrganizationInvitation<
            TOrganizationCustomFields,
            TUserCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions),
        removeOrganizationMember: new RemoveOrganizationMember(adapters as any),
        updateOrganizationMemberRole: new UpdateOrganizationMemberRole(adapters as any),
        leaveOrganization: new LeaveOrganization<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >(adapters as any, toolkitOptions)
    };
}

/**
 * Factory function to create all use cases
 *
 * @param adapters - Application adapters (repositories, system, etc.)
 * @param toolkitOptions - Optional toolkit options with custom schemas
 *
 * @example
 * ```typescript
 * import { createSupabaseAdapters, createUseCases } from '@multitenantkit/adapter-persistence-supabase';
 *
 * const adapters = createSupabaseAdapters({ client });
 * const useCases = createUseCases(adapters);
 *
 * // Use the API
 * await useCases.users.createUser.execute(...);
 * ```
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
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): UseCases {
    return {
        users: createUserUseCases(adapters, toolkitOptions),
        organizations: createOrganizationUseCases(adapters, toolkitOptions),
        memberships: createMembershipUseCases(adapters, toolkitOptions)
    };
}
