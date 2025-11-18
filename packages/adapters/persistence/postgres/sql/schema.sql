-- MultiTenantKit Database Schema
-- =================================
-- This file contains the complete database schema for MultiTenantKit.
--
-- Usage:
--   1. Create a PostgreSQL database
--   2. Run this script to create all required tables
--   3. Configure your DATABASE_URL environment variable
--
-- Note: These are the base tables. You may need to add custom columns
-- depending on your application's custom fields configuration.

-- =====================
-- Users Table
-- =====================
-- Represents individual users in your application
--
-- Column Mapping:
--   - If using Supabase Auth with auth.users table:
--     * externalId → auth.users.id (column not needed, use columnMapping)
--     * username → auth.users.email (column not needed, use columnMapping)
--
--   - If using a separate users table:
--     * Include all columns below
--
CREATE TABLE IF NOT EXISTS users (
    -- Core columns
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL UNIQUE, -- Auth provider user ID (e.g., Supabase, Auth0)
    username VARCHAR(255) NOT NULL UNIQUE,    -- User identifier (email, nickname, phone, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,                   -- Soft delete support

    -- Indexes for performance
    CONSTRAINT users_external_id_unique UNIQUE (external_id),
    CONSTRAINT users_username_unique UNIQUE (username)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Organizations Table
-- =====================
-- Represents teams/organizations in your application
--
CREATE TABLE IF NOT EXISTS organizations (
    -- Core columns
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,              -- References the owner user
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,                  -- Archived organizations (soft archive)
    deleted_at TIMESTAMPTZ,                   -- Soft delete support

    -- Foreign key constraint
    CONSTRAINT fk_organizations_owner_user_id FOREIGN KEY (owner_user_id)
        REFERENCES users(id) ON DELETE RESTRICT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_owner_user_id ON organizations(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_organizations_archived_at ON organizations(archived_at);

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Organization Memberships Table
-- =====================
-- Represents the many-to-many relationship between users and organizations
-- Includes role management and invitation tracking
--
CREATE TABLE IF NOT EXISTS organization_memberships (
    -- Core columns
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,                             -- NULL if user invited but not registered yet
    username VARCHAR(255) NOT NULL,           -- Username cached for performance
    organization_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,           -- 'owner', 'admin', 'member'
    invited_at TIMESTAMPTZ,                   -- When the user was invited
    joined_at TIMESTAMPTZ,                    -- When the user accepted/joined
    left_at TIMESTAMPTZ,                      -- When the user left the organization
    deleted_at TIMESTAMPTZ,                   -- Soft delete support
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_memberships_user_id FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_memberships_organization_id FOREIGN KEY (organization_id)
        REFERENCES organizations(id) ON DELETE CASCADE,

    -- Business rules constraints
    CONSTRAINT chk_role_code CHECK (role_code IN ('owner', 'admin', 'member')),

    -- Unique constraint: one active membership per user per organization
    CONSTRAINT uq_user_organization_active UNIQUE (user_id, organization_id, deleted_at)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON organization_memberships(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON organization_memberships(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_role_code ON organization_memberships(role_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_deleted_at ON organization_memberships(deleted_at);

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_organization_memberships_updated_at BEFORE UPDATE ON organization_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Comments and Notes
-- =====================
--
-- CUSTOM FIELDS:
-- --------------
-- The schema above includes only the base columns.
-- If your application uses custom fields, you need to add those columns:
--
-- Example for users table with custom fields:
--
--   ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
--   ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
--   ALTER TABLE users ADD COLUMN email VARCHAR(255);
--   ALTER TABLE users ADD COLUMN avatar_url TEXT;
--
-- Example for organizations table with custom fields:
--
--   ALTER TABLE organizations ADD COLUMN name VARCHAR(100) NOT NULL;
--   ALTER TABLE organizations ADD COLUMN description TEXT;
--   ALTER TABLE organizations ADD COLUMN logo_url TEXT;
--
-- COLUMN MAPPING:
-- ---------------
-- If your existing database has different column names, use the columnMapping
-- configuration in ToolkitOptions instead of renaming columns:
--
--   toolkitOptions: {
--     users: {
--       customFields: {
--         columnMapping: {
--           externalId: 'auth_provider_id',  // Maps externalId to auth_provider_id
--           username: 'email'                 // Maps username to email
--         }
--       }
--     }
--   }
--
-- SUPABASE INTEGRATION:
-- ---------------------
-- If you're using Supabase Auth with the auth.users table, you typically don't need
-- a separate users table. Instead, configure columnMapping to use auth.users directly:
--
--   toolkitOptions: {
--     users: {
--       database: {
--         schema: 'auth',
--         table: 'users'
--       },
--       customFields: {
--         columnMapping: {
--           externalId: 'id',      // Use auth.users.id as externalId
--           username: 'email'      // Use auth.users.email as username
--         }
--       }
--     }
--   }
--
-- In this case, you only need to create organizations and organization_memberships tables.
--
-- NAMING STRATEGIES:
-- ------------------
-- If your database uses snake_case naming but your application uses camelCase,
-- use the namingStrategy configuration:
--
--   toolkitOptions: {
--     namingStrategy: 'snake_case'  // Automatically converts camelCase ↔ snake_case
--   }
--
-- This applies to custom fields only. Base fields already use snake_case
-- in the database (external_id, created_at, etc.).
