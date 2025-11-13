import postgres from 'postgres';
import { UnitOfWork, RepositoryBundle, FrameworkConfig } from '@multitenantkit/domain-contracts';
import { PostgresUserRepository } from '../repositories/PostgresUserRepository';
import { PostgresOrganizationRepository } from '../repositories/PostgresOrganizationRepository';
import { PostgresOrganizationMembershipRepository } from '../repositories/PostgresOrganizationMembershipRepository';

/**
 * PostgreSQL-based Unit of Work implementation
 * Provides real database transactions using postgres.js transaction capabilities
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields for UserRepository
 * @template TOrganizationCustomFields - Custom fields for Organizations (future)
 * @template TOrganizationMembershipCustomFields - Custom fields for OrganizationMemberships (future)
 */
export class PostgresUnitOfWork<
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
    constructor(
        private readonly sql: postgres.Sql,
        private readonly frameworkConfig?: FrameworkConfig<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) {}

    /**
     * Execute work within a PostgreSQL transaction
     * Uses postgres.js built-in transaction support for true ACID compliance
     */
    async transaction<T>(
        work: (
            repos: RepositoryBundle<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        ) => Promise<T>
    ): Promise<T> {
        return (await this.sql.begin(async (transaction: postgres.Sql) => {
            // Create repository bundle with transaction SQL client and complete framework config
            const repos: RepositoryBundle<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            > = {
                users: new PostgresUserRepository<TUserCustomFields>(
                    transaction,
                    this.frameworkConfig
                ),
                organizations: new PostgresOrganizationRepository<TOrganizationCustomFields>(
                    transaction,
                    this.frameworkConfig
                ),
                organizationMemberships: new PostgresOrganizationMembershipRepository<
                    TUserCustomFields,
                    TOrganizationCustomFields,
                    TOrganizationMembershipCustomFields
                >(transaction, this.frameworkConfig)
            };

            // Execute the work within the transaction
            return await work(repos);
        })) as Promise<T>;
    }
}
