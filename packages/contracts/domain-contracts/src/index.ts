/**
 * multitenantkit/domain-contracts
 *
 * Domain Contracts
 * Central source of truth for all domain schemas and types
 * Organized by vertical slices (users, organizations, organization-memberships)
 */

// Shared types and primitives
export * from './shared';

// Vertical slices
export * from './users';
export * from './organizations';
export * from './organization-memberships';

// Use cases composition types
export * from './types';
