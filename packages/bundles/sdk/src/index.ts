// =============================================================================
// multitenantkit/sdk
// Complete SDK bundle - re-exports all packages for easy consumption
// =============================================================================

// Authentication Adapters - Export as namespace
export * as AdapterAuthSupabase from '@multitenantkit/adapter-auth-supabase';
// Persistence Adapters - Export as namespace to avoid mapper name conflicts
export * as AdapterPersistenceJson from '@multitenantkit/adapter-persistence-json';
export * as AdapterPersistencePostgres from '@multitenantkit/adapter-persistence-postgres';
// System Adapters - Export as namespace
export * as AdapterSystemCryptoUuid from '@multitenantkit/adapter-system-crypto-uuid';
export * as AdapterSystemSystemClock from '@multitenantkit/adapter-system-system-clock';
// Transport Adapters - Export as namespace
export * as AdapterTransportExpress from '@multitenantkit/adapter-transport-express';
export * from '@multitenantkit/api-contracts';
// API Handlers - Direct exports
export * from '@multitenantkit/api-handlers';
// Composition - Direct exports
export * from '@multitenantkit/composition';
// Core Domain - Direct exports (entities, use cases, implementations)
export * from '@multitenantkit/domain';
// Contracts - Direct exports (schemas and types)
export * from '@multitenantkit/domain-contracts';
// Convenience functions for quick setup
export * from './convenience';
// Supabase-specific convenience functions
export * from './supabase';
