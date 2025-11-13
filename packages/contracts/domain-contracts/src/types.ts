/**
 * Use Cases composition types
 * Defines the structure of the use cases container for dependency injection
 */

import type {
    ICreateUser,
    IGetUser,
    IUpdateUser,
    IListUserOrganizations,
    IDeleteUser
} from './users';

import type {
    ICreateOrganization,
    IGetOrganization,
    IUpdateOrganization,
    IListOrganizationMembers,
    IDeleteOrganization,
    IArchiveOrganization,
    IRestoreOrganization,
    ITransferOrganizationOwnership
} from './organizations';

import type {
    IAddOrganizationMember,
    IAcceptOrganizationInvitation,
    IRemoveOrganizationMember,
    IUpdateOrganizationMemberRole,
    ILeaveOrganization
} from './organization-memberships';

export interface UserUseCases {
    createUser: ICreateUser;
    getUser: IGetUser;
    updateUser: IUpdateUser;
    listUserOrganizations: IListUserOrganizations;
    deleteUser: IDeleteUser;
}

export interface OrganizationUseCases {
    createOrganization: ICreateOrganization;
    getOrganization: IGetOrganization;
    updateOrganization: IUpdateOrganization;
    listOrganizationMembers: IListOrganizationMembers;
    deleteOrganization: IDeleteOrganization;
    archiveOrganization: IArchiveOrganization;
    restoreOrganization: IRestoreOrganization;
    transferOrganizationOwnership: ITransferOrganizationOwnership;
}

export interface MembershipUseCases {
    addOrganizationMember: IAddOrganizationMember;
    acceptOrganizationInvitation: IAcceptOrganizationInvitation;
    removeOrganizationMember: IRemoveOrganizationMember;
    updateOrganizationMemberRole: IUpdateOrganizationMemberRole;
    leaveOrganization: ILeaveOrganization;
}

export interface UseCases {
    users: UserUseCases;
    organizations: OrganizationUseCases;
    memberships: MembershipUseCases;
}
