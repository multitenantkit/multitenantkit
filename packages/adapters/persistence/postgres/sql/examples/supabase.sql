-- MultiTenantKit Schema for Supabase Integration
-- ===============================================
--
-- This schema is for applications using Supabase Auth.
-- Supabase provides an auth.users table, so we don't create a separate users table.
-- We only need to create organizations and organization_memberships.
--
-- Prerequisites:
--   1. Supabase project with Auth enabled
--   2. Access to your Supabase database
--
-- Usage:
--   1. Run this script in your Supabase SQL Editor
--   2. Configure your application with the config below
--

-- =====================
-- Organizations Table
-- =====================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    -- Custom fields (example)
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Foreign key references auth.users
    CONSTRAINT fk_organizations_owner_user_id FOREIGN KEY (owner_user_id)
        REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_user_id ON public.organizations(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON public.organizations(deleted_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Organization Memberships Table
-- =====================
CREATE TABLE IF NOT EXISTS public.organization_memberships (
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

    -- Foreign keys
    CONSTRAINT fk_memberships_user_id FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_memberships_organization_id FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_role_code CHECK (role_code IN ('owner', 'admin', 'member')),
    CONSTRAINT uq_user_organization_active UNIQUE (user_id, organization_id, deleted_at)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.organization_memberships(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON public.organization_memberships(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_role_code ON public.organization_memberships(role_code) WHERE deleted_at IS NULL;

CREATE TRIGGER update_organization_memberships_updated_at BEFORE UPDATE ON public.organization_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Row Level Security (RLS)
-- =====================
-- Optional: Enable RLS for organizations and memberships
-- Customize these policies based on your security requirements

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can see organizations they're members of
CREATE POLICY "Users can view their organizations" ON public.organizations
    FOR SELECT USING (
        owner_user_id = auth.uid() OR
        id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
    );

-- Example policy: Users can view memberships of organizations they belong to
CREATE POLICY "Users can view organization memberships" ON public.organization_memberships
    FOR SELECT USING (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
    );

-- =====================
-- Application Configuration
-- =====================
-- Use this TypeScript configuration with the schema above:
/*
import { FrameworkConfig } from '@multitenantkit/sdk';
import { z } from 'zod';

const frameworkConfig: FrameworkConfig = {
  users: {
    database: {
      schema: 'auth',
      table: 'users'
    },
    customFields: {
      columnMapping: {
        externalId: 'id',       // auth.users.id is the externalId
        username: 'email'       // auth.users.email is the username
      },
      customSchema: z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email()
      }),
      customMapper: {
        toDb: (fields) => ({
          raw_user_meta_data: {
            firstName: fields.firstName,
            lastName: fields.lastName
          }
        }),
        toDomain: (dbRow) => ({
          firstName: dbRow.raw_user_meta_data?.firstName,
          lastName: dbRow.raw_user_meta_data?.lastName,
          email: dbRow.email
        })
      }
    }
  },
  organizations: {
    database: {
      schema: 'public',
      table: 'organizations'
    },
    customFields: {
      customSchema: z.object({
        name: z.string(),
        description: z.string().nullable()
      })
    }
  },
  organizationMemberships: {
    database: {
      schema: 'public',
      table: 'organization_memberships'
    }
  }
};
*/
