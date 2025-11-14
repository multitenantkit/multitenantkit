import type {
    OperationContext,
    Organization,
    PaginatedResult,
    User
} from '@multitenantkit/domain-contracts';
import type {
    FindMembersOptions,
    OrganizationMembership,
    OrganizationMembershipRepository,
    OrganizationMemberWithUserInfo
} from '@multitenantkit/domain-contracts/organization-memberships';

/**
 * Mock implementation of OrganizationMembershipRepository for testing
 */
export class MockOrganizationMembershipRepository<
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is correct for optional custom fields in mocks
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is correct for optional custom fields in mocks
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: Empty object {} is correct for optional custom fields in mocks
    TOrganizationMembershipCustomFields = {}
> implements
        OrganizationMembershipRepository<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
{
    public readonly memberships = new Map<
        string,
        OrganizationMembership & TOrganizationMembershipCustomFields
    >();
    public readonly mockUsers = new Map<string, User & TUserCustomFields>();
    public readonly mockOrganizations = new Map<string, Organization & TOrganizationCustomFields>();
    public saveCallCount = 0;
    public lastSavedMembership:
        | (OrganizationMembership & TOrganizationMembershipCustomFields)
        | null = null;
    private saveError: Error | null = null;

    async insert(
        membership: OrganizationMembership & TOrganizationMembershipCustomFields,
        _context?: OperationContext
    ): Promise<void> {
        this.saveCallCount++;
        this.lastSavedMembership = membership;

        if (this.saveError) {
            throw this.saveError;
        }

        this.memberships.set(membership.id, membership);
    }

    async findById(
        id: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        return this.memberships.get(id) || null;
    }

    async findByUserIdAndOrganizationId(
        userId: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        for (const membership of this.memberships.values()) {
            if (membership.userId === userId && membership.organizationId === organizationId) {
                return membership;
            }
        }
        return null;
    }

    async findByUsernameAndOrganizationId(
        username: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        for (const membership of this.memberships.values()) {
            if (membership.username === username && membership.organizationId === organizationId) {
                return membership;
            }
        }
        return null;
    }

    async findByOrganization(
        organizationId: string,
        activeOnly?: boolean
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        const result: (OrganizationMembership & TOrganizationMembershipCustomFields)[] = [];

        for (const membership of this.memberships.values()) {
            if (membership.organizationId === organizationId) {
                if (!activeOnly || (!membership.leftAt && !membership.deletedAt)) {
                    result.push(membership);
                }
            }
        }

        return result;
    }

    async findByOrganizationWithUserInfo(
        organizationId: string,
        activeOnly?: boolean
    ): Promise<
        OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[]
    > {
        // For testing purposes, return flat structure with mock user and organization
        // TODO: update activeOnly
        const memberships = await this.findByOrganization(organizationId, activeOnly);

        return memberships.map((membership) => {
            const user = membership.userId ? this.mockUsers.get(membership.userId) : null;
            const organization = this.mockOrganizations.get(membership.organizationId);

            if (!user || !organization) {
                throw new Error(
                    `Mock user or organization not found for membership ${membership.id}`
                );
            }

            return {
                ...membership,
                user,
                organization
            } as OrganizationMemberWithUserInfo<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >;
        });
    }

    async findByOrganizationWithUserInfoPaginated(
        organizationId: string,
        options?: FindMembersOptions
    ): Promise<
        PaginatedResult<
            OrganizationMemberWithUserInfo<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        >
    > {
        // Set defaults
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 20;
        const activeOnly = options?.includeActive || false;

        // Get all matching members
        const allMembers = await this.findByOrganizationWithUserInfo(organizationId, activeOnly);

        // Calculate pagination
        const total = allMembers.length;
        const totalPages = Math.ceil(total / pageSize);
        const offset = (page - 1) * pageSize;
        const items = allMembers.slice(offset, offset + pageSize);

        return {
            items,
            total,
            page,
            pageSize,
            totalPages
        };
    }

    async findByUser(
        userId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        const result: (OrganizationMembership & TOrganizationMembershipCustomFields)[] = [];

        for (const membership of this.memberships.values()) {
            if (membership.userId === userId) {
                result.push(membership);
            }
        }

        return result;
    }

    async update(
        membership: OrganizationMembership & TOrganizationMembershipCustomFields,
        _context?: OperationContext
    ): Promise<void> {
        this.memberships.set(membership.id, membership);
    }

    async delete(id: string, _context?: OperationContext): Promise<void> {
        this.memberships.delete(id);
    }

    async findAll(): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        return Array.from(this.memberships.values());
    }

    // Test helper methods
    setSaveError(error: Error | null): void {
        this.saveError = error;
    }

    reset(): void {
        this.memberships.clear();
        this.saveCallCount = 0;
        this.lastSavedMembership = null;
        this.saveError = null;
    }

    // Helper method to add membership for testing
    addMembership(membership: OrganizationMembership & TOrganizationMembershipCustomFields): void {
        this.memberships.set(membership.id, membership);
    }

    // Helper methods to add mock users and organizations for testing
    addMockUser(user: User & TUserCustomFields): void {
        this.mockUsers.set(user.id, user);
    }

    addMockOrganization(organization: Organization & TOrganizationCustomFields): void {
        this.mockOrganizations.set(organization.id, organization);
    }
}
