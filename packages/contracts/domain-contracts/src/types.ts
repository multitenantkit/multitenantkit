/**
 * Use Cases composition types
 * Defines the structure of the use cases container for dependency injection
 */

import type {
    IAcceptOrganizationInvitation,
    IAddOrganizationMember,
    ILeaveOrganization,
    IRemoveOrganizationMember,
    IUpdateOrganizationMemberRole
} from './organization-memberships';

import type {
    IArchiveOrganization,
    ICreateOrganization,
    IDeleteOrganization,
    IGetOrganization,
    IListOrganizationMembers,
    IRestoreOrganization,
    ITransferOrganizationOwnership,
    IUpdateOrganization
} from './organizations';
import type {
    ICreateUser,
    IDeleteUser,
    IGetUser,
    IListUserOrganizations,
    IUpdateUser
} from './users';

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
