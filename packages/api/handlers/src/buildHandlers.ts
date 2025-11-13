import { HandlerPackage } from './types';
import type { UseCases, FrameworkConfig } from '@multitenantkit/domain-contracts';
import {
    createUserHandlerPackage,
    getUserHandlerPackage,
    updateUserHandlerPackage,
    listUserOrganizationsHandlerPackage,
    deleteUserHandlerPackage
} from './users';
import {
    createOrganizationHandlerPackage,
    getOrganizationHandlerPackage,
    updateOrganizationHandlerPackage,
    listOrganizationMembersHandlerPackage,
    deleteOrganizationHandlerPackage,
    archiveOrganizationHandlerPackage,
    restoreOrganizationHandlerPackage,
    transferOrganizationOwnershipHandlerPackage
} from './organizations';
import {
    addOrganizationMemberHandlerPackage,
    acceptOrganizationInvitationHandlerPackage,
    removeOrganizationMemberHandlerPackage,
    updateOrganizationMemberRoleHandlerPackage,
    leaveOrganizationHandlerPackage
} from './organization-memberships';

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
 * @param frameworkConfig - Optional framework configuration for custom schemas
 * @returns Array of handler packages ready for transport layer
 */
export function buildHandlers<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
>(
    useCases: UseCases,
    frameworkConfig?: FrameworkConfig<
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
): HandlerPackage<any, any>[] {
    return [
        // User handlers - Order matters! More specific routes first
        createUserHandlerPackage(useCases, frameworkConfig),
        getUserHandlerPackage(useCases, frameworkConfig),
        updateUserHandlerPackage(useCases, frameworkConfig),
        listUserOrganizationsHandlerPackage(useCases, frameworkConfig),
        deleteUserHandlerPackage(useCases, frameworkConfig), // DELETE should come last

        // Organization handlers - Order matters! More specific routes first
        createOrganizationHandlerPackage(useCases, frameworkConfig),
        listOrganizationMembersHandlerPackage(useCases, frameworkConfig as any), // Must come before getOrganizationHandlerPackage
        archiveOrganizationHandlerPackage(useCases, frameworkConfig), // POST /organizations/:organizationId/archive (specific action)
        restoreOrganizationHandlerPackage(useCases, frameworkConfig), // POST /organizations/:organizationId/restore (specific action)
        transferOrganizationOwnershipHandlerPackage(useCases, frameworkConfig), // POST /organizations/:organizationId/transfer-ownership (specific action)
        getOrganizationHandlerPackage(useCases, frameworkConfig),
        updateOrganizationHandlerPackage(useCases, frameworkConfig),
        deleteOrganizationHandlerPackage(useCases, frameworkConfig), // DELETE should come last

        // Organization Membership handlers - Order matters! More specific routes first
        addOrganizationMemberHandlerPackage(useCases),
        acceptOrganizationInvitationHandlerPackage(useCases, frameworkConfig),
        updateOrganizationMemberRoleHandlerPackage(useCases),
        leaveOrganizationHandlerPackage(useCases),
        removeOrganizationMemberHandlerPackage(useCases) // DELETE should come last
    ];
}
