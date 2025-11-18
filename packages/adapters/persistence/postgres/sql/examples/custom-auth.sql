-- MultiTenantKit Schema for Custom Authentication
-- ================================================
--
-- This schema is for applications using custom authentication
-- (Auth0, Cognito, Firebase, custom JWT, etc.)
--
-- This creates all three tables: users, organizations, and organization_memberships
-- with common custom fields included as examples.
--

-- =====================
-- Helper Function
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================
-- Users Table
-- =====================
CREATE TABLE IF NOT EXISTS users (
    -- CORE columns
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Custom fields (example - adjust to your needs)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(50),

    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Organizations Table
-- =====================
CREATE TABLE IF NOT EXISTS organizations (
    -- CORE columns
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    -- Custom fields (example - adjust to your needs)
    name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,

    CONSTRAINT fk_organizations_owner_user_id FOREIGN KEY (owner_user_id)
        REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_user_id ON organizations(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_organizations_archived_at ON organizations(archived_at);

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Organization Memberships Table
-- =====================
CREATE TABLE IF NOT EXISTS organization_memberships (
    -- CORE columns
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    username VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_memberships_user_id FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_memberships_organization_id FOREIGN KEY (organization_id)
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT chk_role_code CHECK (role_code IN ('owner', 'admin', 'member')),
    CONSTRAINT uq_user_organization_active UNIQUE (user_id, organization_id, deleted_at)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON organization_memberships(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON organization_memberships(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_role_code ON organization_memberships(role_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_deleted_at ON organization_memberships(deleted_at);

CREATE TRIGGER update_organization_memberships_updated_at BEFORE UPDATE ON organization_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Application Configuration
-- =====================
-- Use this TypeScript configuration with the schema above:
/*
import { ToolkitOptions } from '@multitenantkit/sdk';
import { z } from 'zod';

const toolkitOptions: ToolkitOptions = {
  namingStrategy: 'snake_case',  // Auto-converts camelCase ↔ snake_case

  users: {
    customFields: {
      customSchema: z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        avatarUrl: z.string().url().optional(),
        phoneNumber: z.string().optional()
      })
    }
  },

  organizations: {
    customFields: {
      customSchema: z.object({
        name: z.string(),
        description: z.string().nullable(),
        logoUrl: z.string().url().optional(),
        websiteUrl: z.string().url().optional()
      })
    }
  }
};
*/
