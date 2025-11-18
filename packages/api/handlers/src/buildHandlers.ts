import type { ToolkitOptions, UseCases } from '@multitenantkit/domain-contracts';
import {
    acceptOrganizationInvitationHandlerPackage,
    addOrganizationMemberHandlerPackage,
    leaveOrganizationHandlerPackage,
    removeOrganizationMemberHandlerPackage,
    updateOrganizationMemberRoleHandlerPackage
} from './organization-memberships';
import {
    archiveOrganizationHandlerPackage,
    createOrganizationHandlerPackage,
    deleteOrganizationHandlerPackage,
    getOrganizationHandlerPackage,
    listOrganizationMembersHandlerPackage,
    restoreOrganizationHandlerPackage,
    transferOrganizationOwnershipHandlerPackage,
    updateOrganizationHandlerPackage
} from './organizations';
import type { HandlerPackage } from './types';
import {
    createUserHandlerPackage,
    deleteUserHandlerPackage,
    getUserHandlerPackage,
    listUserOrganizationsHandlerPackage,
    updateUserHandlerPackage
} from './users';

/**
 * Build all HTTP handler packages from use cases
 * This function wires use cases to HTTP handlers
 *
 * Generic support:
 * @template TUserCustomFields - Custom fields for Users
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * @param useCases - The composed use cases from the composition root
 * @param toolkitOptions - Optional toolkit options for custom schemas
 * @returns Array of handler packages ready for transport layer
 */
export function buildHandlers<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
>(
    useCases: UseCases,
    toolkitOptions?: ToolkitOptions<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): HandlerPackage<any, any>[] {
    return [
        // User handlers - Order matters! More specific routes first
        createUserHandlerPackage(useCases, toolkitOptions),
        getUserHandlerPackage(useCases, toolkitOptions),
        updateUserHandlerPackage(useCases, toolkitOptions),
        listUserOrganizationsHandlerPackage(useCases, toolkitOptions),
        deleteUserHandlerPackage(useCases, toolkitOptions), // DELETE should come last

        // Organization handlers - Order matters! More specific routes first
        createOrganizationHandlerPackage(useCases, toolkitOptions),
        listOrganizationMembersHandlerPackage(useCases, toolkitOptions as any), // Must come before getOrganizationHandlerPackage
        archiveOrganizationHandlerPackage(useCases, toolkitOptions), // POST /organizations/:organizationId/archive (specific action)
        restoreOrganizationHandlerPackage(useCases, toolkitOptions), // POST /organizations/:organizationId/restore (specific action)
        transferOrganizationOwnershipHandlerPackage(useCases, toolkitOptions), // POST /organizations/:organizationId/transfer-ownership (specific action)
        getOrganizationHandlerPackage(useCases, toolkitOptions),
        updateOrganizationHandlerPackage(useCases, toolkitOptions),
        deleteOrganizationHandlerPackage(useCases, toolkitOptions), // DELETE should come last

        // Organization Membership handlers - Order matters! More specific routes first
        addOrganizationMemberHandlerPackage(useCases),
        acceptOrganizationInvitationHandlerPackage(useCases, toolkitOptions),
        updateOrganizationMemberRoleHandlerPackage(useCases),
        leaveOrganizationHandlerPackage(useCases),
        removeOrganizationMemberHandlerPackage(useCases) // DELETE should come last
    ];
}
