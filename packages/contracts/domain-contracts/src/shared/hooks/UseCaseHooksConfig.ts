// Organization Membership use case types
import type {
    AddOrganizationMemberInput,
    AddOrganizationMemberOutput,
    LeaveOrganizationInput,
    LeaveOrganizationOutput,
    RemoveOrganizationMemberInput,
    RemoveOrganizationMemberOutput,
    UpdateOrganizationMemberRoleInput,
    UpdateOrganizationMemberRoleOutput
} from '../../organization-memberships/use-cases';
import type { Organization } from '../../organizations/entities';
// Organization use case types
import type {
    CreateOrganizationInput,
    CreateOrganizationOutput,
    DeleteOrganizationInput,
    GetOrganizationInput,
    GetOrganizationOutput,
    ListOrganizationMembersInput,
    ListOrganizationMembersOutput,
    RestoreOrganizationInput,
    TransferOrganizationOwnershipInput,
    TransferOrganizationOwnershipOutput,
    UpdateOrganizationInput,
    UpdateOrganizationOutput
} from '../../organizations/use-cases';
// Domain entity types
import type { User } from '../../users/entities';

// User use case types
import type {
    CreateUserInput,
    CreateUserOutput,
    DeleteUserInput,
    GetUserInput,
    ListUserOrganizationsInput,
    ListUserOrganizationsOutput,
    UpdateUserInput
} from '../../users/use-cases';
import type { IDomainError } from '../errors/IDomainError';
import type { UseCaseHooks } from './UseCaseHooks';

/**
 * Type-safe configuration of hooks per use case
 * Defines all available use cases in the framework with their specific Input/Output/Error types
 *
 * This provides:
 * - ✅ Autocompletion of use case names
 * - ✅ Type-safe input/output/error types for each hook
 * - ✅ Compile-time validation of hook configurations
 * - ✅ Refactoring safety (renaming a use case updates all references)
 *
 * @example
 * ```typescript
 * const config: UseCaseHooksConfig = {
 *     CreateUser: {
 *         onStart: ({ input }) => {
 *             // input is type-safe: CreateUserInput
 *             console.log(input.externalId); // ✅ TypeScript knows this exists
 *         },
 *         afterExecution: ({ output }) => {
 *             // output is type-safe: CreateUserOutput
 *             console.log(output.id); // ✅ Correct
 *         }
 *     },
 *     GetOrganization: {
 *         onError: ({ error }) => {
 *             // error is type-safe: IDomainError
 *             console.log(error.message);
 *         }
 *     }
 * };
 * ```
 */
export interface UseCaseHooksConfig {
    // ========================================
    // User Use Cases
    // ========================================

    /**
     * Hooks for CreateUser use case
     * Creates a new user in the system
     */
    CreateUser?: UseCaseHooks<CreateUserInput, CreateUserOutput, IDomainError>;

    /**
     * Hooks for GetUser use case
     * Retrieves user information by ID
     */
    GetUser?: UseCaseHooks<GetUserInput, User, IDomainError>;

    /**
     * Hooks for UpdateUser use case
     * Updates user profile information
     */
    UpdateUser?: UseCaseHooks<UpdateUserInput, User, IDomainError>;

    /**
     * Hooks for ListUserOrganizations use case
     * Lists all organizations a user belongs to
     */
    ListUserOrganizations?: UseCaseHooks<
        ListUserOrganizationsInput,
        ListUserOrganizationsOutput,
        IDomainError
    >;

    /**
     * Hooks for DeleteUser use case
     * Soft deletes a user from the system
     */
    DeleteUser?: UseCaseHooks<DeleteUserInput, void, IDomainError>;

    // ========================================
    // Organization Use Cases
    // ========================================

    /**
     * Hooks for CreateOrganization use case
     * Creates a new organization with the user as owner
     */
    CreateOrganization?: UseCaseHooks<
        CreateOrganizationInput,
        CreateOrganizationOutput,
        IDomainError
    >;

    /**
     * Hooks for GetOrganization use case
     * Retrieves organization information by ID
     */
    GetOrganization?: UseCaseHooks<GetOrganizationInput, GetOrganizationOutput, IDomainError>;

    /**
     * Hooks for UpdateOrganization use case
     * Updates organization information (requires owner/admin permissions)
     */
    UpdateOrganization?: UseCaseHooks<
        UpdateOrganizationInput,
        UpdateOrganizationOutput,
        IDomainError
    >;

    /**
     * Hooks for ListOrganizationMembers use case
     * Lists all members of a organization with their roles
     */
    ListOrganizationMembers?: UseCaseHooks<
        ListOrganizationMembersInput,
        ListOrganizationMembersOutput,
        IDomainError
    >;

    /**
     * Hooks for DeleteOrganization use case
     * Soft deletes a organization (requires owner permissions)
     */
    DeleteOrganization?: UseCaseHooks<DeleteOrganizationInput, void, IDomainError>;

    /**
     * Hooks for RestoreOrganization use case
     * Restores a previously deleted organization (requires owner permissions)
     */
    RestoreOrganization?: UseCaseHooks<RestoreOrganizationInput, Organization, IDomainError>;

    /**
     * Hooks for TransferOrganizationOwnership use case
     * Transfers organization ownership to another member (requires owner permissions)
     */
    TransferOrganizationOwnership?: UseCaseHooks<
        TransferOrganizationOwnershipInput,
        TransferOrganizationOwnershipOutput,
        IDomainError
    >;

    // ========================================
    // Organization Membership Use Cases
    // ========================================

    /**
     * Hooks for AddOrganizationMember use case
     * Adds a new member to a organization (requires owner/admin permissions)
     */
    AddOrganizationMember?: UseCaseHooks<
        AddOrganizationMemberInput,
        AddOrganizationMemberOutput,
        IDomainError
    >;

    /**
     * Hooks for RemoveOrganizationMember use case
     * Removes a member from a organization (requires owner/admin permissions)
     */
    RemoveOrganizationMember?: UseCaseHooks<
        RemoveOrganizationMemberInput,
        RemoveOrganizationMemberOutput,
        IDomainError
    >;

    /**
     * Hooks for UpdateOrganizationMemberRole use case
     * Updates a member's role in a organization (requires owner/admin permissions)
     */
    UpdateOrganizationMemberRole?: UseCaseHooks<
        UpdateOrganizationMemberRoleInput,
        UpdateOrganizationMemberRoleOutput,
        IDomainError
    >;

    /**
     * Hooks for LeaveOrganization use case
     * Allows a member to voluntarily leave a organization
     */
    LeaveOrganization?: UseCaseHooks<LeaveOrganizationInput, LeaveOrganizationOutput, IDomainError>;

    // Future use cases can be added here as the framework grows
    // Example:
    // ArchiveOrganization?: UseCaseHooks<ArchiveOrganizationInput, ArchiveOrganizationOutput, IDomainError>;
    // UnarchiveOrganization?: UseCaseHooks<UnarchiveOrganizationInput, UnarchiveOrganizationOutput, IDomainError>;
}
