import { UnitOfWork, RepositoryBundle } from '@multitenantkit/domain-contracts';
import { JsonUserRepository } from '../repositories/JsonUserRepository';
import { JsonOrganizationRepository } from '../repositories/JsonOrganizationRepository';
import { JsonOrganizationMembershipRepository } from '../repositories/JsonOrganizationMembershipRepository';

/**
 * JSON-based Unit of Work implementation
 * For JSON storage, we simulate transactions by using file locks
 * In a real implementation, this would use database transactions
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 *
 * Note: JSON adapter doesn't actually use custom fields types,
 * but maintains the same signature for consistency with other adapters
 */
export class JsonUnitOfWork<
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
    private readonly dataDir: string;
    private readonly lockMap = new Map<string, Promise<void>>();

    constructor(dataDir: string = './data') {
        this.dataDir = dataDir;
    }

    async transaction<T>(
        work: (
            repos: RepositoryBundle<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        ) => Promise<T>
    ): Promise<T> {
        // Simple file-based locking mechanism
        // In production, you'd use proper database transactions
        const lockKey = 'transaction';

        // Wait for any existing transaction to complete
        if (this.lockMap.has(lockKey)) {
            await this.lockMap.get(lockKey);
        }

        // Create new transaction promise
        let resolveLock: () => void;
        const lockPromise = new Promise<void>((resolve) => {
            resolveLock = resolve;
        });
        this.lockMap.set(lockKey, lockPromise);

        try {
            // Create repository bundle
            // Note: JSON repositories don't actually support custom fields,
            // so we cast to maintain compatibility with the UnitOfWork interface
            const userRepo = new JsonUserRepository(this.dataDir);
            const organizationRepo = new JsonOrganizationRepository(this.dataDir);
            const repos: RepositoryBundle<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            > = {
                users: userRepo as any,
                organizations: organizationRepo as any,
                organizationMemberships: new JsonOrganizationMembershipRepository(
                    userRepo as any,
                    organizationRepo as any,
                    this.dataDir
                ) as any
            };

            // Execute the work within the "transaction"
            const result = await work(repos);

            return result;
        } catch (error) {
            // In a real database, we would rollback here
            // For JSON files, we don't have rollback capability
            // This is a limitation of the JSON adapter
            throw error;
        } finally {
            // Release the lock
            this.lockMap.delete(lockKey);
            resolveLock!();
        }
    }
}
