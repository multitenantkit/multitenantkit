// =============================================================================
// multitenantkit/sdk
// Complete SDK bundle - re-exports all packages for easy consumption
// =============================================================================

// Core Domain - Direct exports (entities, use cases, implementations)
export * from '@multitenantkit/domain';

// Contracts - Direct exports (schemas and types)
export * from '@multitenantkit/domain-contracts';
export * from '@multitenantkit/api-contracts';

// API Handlers - Direct exports
export * from '@multitenantkit/api-handlers';

// Composition - Direct exports
export * from '@multitenantkit/composition';

// Persistence Adapters - Export as namespace to avoid mapper name conflicts
export * as AdapterPersistenceJson from '@multitenantkit/adapter-persistence-json';
export * as AdapterPersistencePostgres from '@multitenantkit/adapter-persistence-postgres';

// Authentication Adapters - Export as namespace
export * as AdapterAuthSupabase from '@multitenantkit/adapter-auth-supabase';

// Transport Adapters - Export as namespace
export * as AdapterTransportExpress from '@multitenantkit/adapter-transport-express';

// System Adapters - Export as namespace
export * as AdapterSystemCryptoUuid from '@multitenantkit/adapter-system-crypto-uuid';
export * as AdapterSystemSystemClock from '@multitenantkit/adapter-system-system-clock';
