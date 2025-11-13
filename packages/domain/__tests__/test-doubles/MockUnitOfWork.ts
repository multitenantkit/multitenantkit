import { UnitOfWork, RepositoryBundle } from '@multitenantkit/domain-contracts';
import { MockUserRepository } from './MockUserRepository';
import { MockOrganizationRepository } from './MockOrganizationRepository';
import { MockOrganizationMembershipRepository } from './MockOrganizationMembershipRepository';

/**
 * Mock implementation of UnitOfWork for testing
 * Provides transaction-like behavior with rollback capability
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * Note: Mock repositories don't actually use custom fields types,
 * but maintains the same signature for consistency
 */
export class MockUnitOfWork<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
> implements
        UnitOfWork<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
{
    public transactionCallCount = 0;
    public lastTransactionWork:
        | ((
              repos: RepositoryBundle<
                  TUserCustomFields,
                  TOrganizationCustomFields,
                  TOrganizationMembershipCustomFields
              >
          ) => Promise<any>)
        | null = null;
    private transactionError: Error | null = null;

    constructor(
        public userRepository: MockUserRepository = new MockUserRepository(),
        public organizationRepository: MockOrganizationRepository = new MockOrganizationRepository(),
        public organizationMembershipRepository: MockOrganizationMembershipRepository = new MockOrganizationMembershipRepository()
    ) {}

    async transaction<T>(
        work: (
            repos: RepositoryBundle<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        ) => Promise<T>
    ): Promise<T> {
        this.transactionCallCount++;
        this.lastTransactionWork = work;

        if (this.transactionError) {
            throw this.transactionError;
        }

        // Note: Mock repositories don't actually support custom fields,
        // so we cast to maintain compatibility with the UnitOfWork interface
        const repos: RepositoryBundle<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        > = {
            users: this.userRepository as any,
            organizations: this.organizationRepository,
            organizationMemberships: this.organizationMembershipRepository
        };

        // Create snapshots for rollback capability
        const userSnapshot = new Map(this.userRepository.users);
        const organizationSnapshot = new Map(this.organizationRepository.organizations);
        const membershipSnapshot = new Map(this.organizationMembershipRepository.memberships);

        try {
            return await work(repos);
        } catch (error) {
            // Rollback on error
            this.userRepository.users.clear();
            userSnapshot.forEach((user, id) => this.userRepository.users.set(id, user));

            this.organizationRepository.organizations.clear();
            organizationSnapshot.forEach((organization, id) =>
                this.organizationRepository.organizations.set(id, organization)
            );

            this.organizationMembershipRepository.memberships.clear();
            membershipSnapshot.forEach((membership, id) =>
                this.organizationMembershipRepository.memberships.set(id, membership)
            );

            throw error;
        }
    }

    // Test helper methods
    setTransactionError(error: Error | null): void {
        this.transactionError = error;
    }

    getUserRepository(): MockUserRepository {
        return this.userRepository;
    }

    getOrganizationRepository(): MockOrganizationRepository {
        return this.organizationRepository;
    }

    getOrganizationMembershipRepository(): MockOrganizationMembershipRepository {
        return this.organizationMembershipRepository;
    }

    reset(): void {
        this.transactionCallCount = 0;
        this.lastTransactionWork = null;
        this.transactionError = null;

        // Clear repositories manually since not all have reset methods
        this.userRepository.users.clear();
        this.organizationRepository.reset();
        this.organizationMembershipRepository.reset();
    }
}
