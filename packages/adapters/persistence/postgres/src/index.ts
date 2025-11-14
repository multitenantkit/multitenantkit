/**
 * Postgres Database Adapter
 *
 * This adapter provides a complete Postgres implementation of the domain repository ports.
 * It's designed to be a drop-in replacement for the JSON adapter while providing
 * production-ready database capabilities.
 *
 * Key Features:
 * - Full transaction support via Unit of Work pattern
 * - Reuses mappers and patterns from JSON adapter
 * - Independent of authentication providers
 * - Schema-first domain-centric architecture
 * - Production-ready with error handling and connection management
 */

// Client and Configuration
export { DatabaseClient } from './client/PostgresClient';
export { createDatabaseConfig, DatabaseConfig, PostgresDBEnvVars } from './client/PostgresConfig';
// Factory Functions and Configuration
export {
    createPostgresRepositories,
    createPostgresUnitOfWork,
    DatabaseFactoryOptions,
    PostgresRepositoryBundle
} from './factory/PostgresFactory';
export { OrganizationMapper } from './mappers/OrganizationMapper';
export { OrganizationMembershipMapper } from './mappers/OrganizationMembershipMapper';

// Mappers (reused from JSON adapter patterns)
export { UserMapper } from './mappers/UserMapper';
export { PostgresOrganizationMembershipRepository } from './repositories/PostgresOrganizationMembershipRepository';
export { PostgresOrganizationRepository } from './repositories/PostgresOrganizationRepository';
// Repositories
export { PostgresUserRepository } from './repositories/PostgresUserRepository';
// Unit of Work
export { PostgresUnitOfWork } from './uow/PostgresUnitOfWork';
