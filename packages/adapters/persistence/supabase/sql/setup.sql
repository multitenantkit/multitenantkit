-- =============================================================================
-- MultiTenantKit: Complete Database Setup for Supabase
-- =============================================================================
-- This script creates all tables, triggers, policies, and foreign keys needed
-- to run MultiTenantKit on a fresh Supabase database.
--
-- Run this script in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Tables created:
--   - public.profiles (synced with auth.users)
--   - public.organizations
--   - public.organization_memberships
-- =============================================================================


-- =============================================================================
-- PART 1: PROFILES TABLE
-- =============================================================================
-- Stores user profile data, synced with auth.users via trigger.
-- The auth.users table is managed by Supabase Auth (GoTrue), so we use this
-- separate table for user data that we control.

CREATE TABLE public.profiles (
    -- Core fields (from UserSchema - snake_case)
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    external_id text NOT NULL,                    -- Auth provider user ID
    username text NOT NULL,                       -- Email or nickname
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,                       -- Soft delete support

    -- Custom fields (add your own)
    first_name text,
    last_name text
);

COMMENT ON TABLE public.profiles IS 'User profiles synced with auth.users - managed by MultiTenantKit';


-- =============================================================================
-- PART 2: ORGANIZATIONS TABLE
-- =============================================================================
-- Base fields from OrganizationSchema: id, ownerUserId, createdAt, updatedAt, archivedAt, deletedAt

CREATE TABLE public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    archived_at timestamptz,
    deleted_at timestamptz,

    -- Custom fields (add your own)
    name text NOT NULL,
    slug text UNIQUE
);

COMMENT ON TABLE public.organizations IS 'Organizations managed by MultiTenantKit';


-- =============================================================================
-- PART 3: ORGANIZATION MEMBERSHIPS TABLE
-- =============================================================================
-- Base fields from OrganizationMembershipSchema

CREATE TABLE public.organization_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,                                 -- NULL for pending invitations
    username text NOT NULL,                       -- Email of invited user
    organization_id uuid NOT NULL,
    role_code text NOT NULL DEFAULT 'member',     -- 'owner', 'admin', 'member'
    invited_at timestamptz,
    joined_at timestamptz,
    left_at timestamptz,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organization_memberships IS 'Organization membership relationships';


-- =============================================================================
-- PART 4: FOREIGN KEYS
-- =============================================================================
-- Required for PostgREST joins in Supabase

-- organization_memberships -> profiles (LEFT JOIN for pending invitations)
ALTER TABLE public.organization_memberships
ADD CONSTRAINT fk_organization_memberships_user
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- organization_memberships -> organizations (INNER JOIN)
ALTER TABLE public.organization_memberships
ADD CONSTRAINT fk_organization_memberships_organization
FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
ON DELETE CASCADE;

-- organizations -> profiles (owner)
ALTER TABLE public.organizations
ADD CONSTRAINT fk_organizations_owner
FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;


-- =============================================================================
-- PART 5: INDEXES
-- =============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_external_id ON public.profiles(external_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Organizations indexes
CREATE INDEX idx_organizations_owner_user_id ON public.organizations(owner_user_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_deleted_at ON public.organizations(deleted_at) WHERE deleted_at IS NOT NULL;

-- Organization memberships indexes
CREATE INDEX idx_organization_memberships_user_id ON public.organization_memberships(user_id);
CREATE INDEX idx_organization_memberships_organization_id ON public.organization_memberships(organization_id);
CREATE INDEX idx_organization_memberships_username ON public.organization_memberships(username);
CREATE UNIQUE INDEX idx_organization_memberships_user_org
    ON public.organization_memberships(user_id, organization_id)
    WHERE user_id IS NOT NULL AND deleted_at IS NULL;


-- =============================================================================
-- PART 6: TRIGGERS
-- =============================================================================

-- Updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    new.updated_at = now();
    RETURN new;
END;
$$;

-- Apply updated_at trigger to all tables
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_organizations_updated
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_organization_memberships_updated
    BEFORE UPDATE ON public.organization_memberships
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, external_id, username, first_name, last_name)
    VALUES (
        new.id,
        new.id::text,
        COALESCE(new.email, new.id::text),
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name'
    );
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Profiles policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- Organizations policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view organizations they belong to"
    ON public.organizations FOR SELECT
    USING (
        owner_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.organization_memberships m
            WHERE m.organization_id = organizations.id
            AND m.user_id = auth.uid()
            AND m.joined_at IS NOT NULL
            AND m.left_at IS NULL
            AND m.deleted_at IS NULL
        )
    );

CREATE POLICY "Owners can update their organizations"
    ON public.organizations FOR UPDATE
    USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Service role has full access to organizations"
    ON public.organizations FOR ALL
    USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- Organization memberships policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view memberships of their organizations"
    ON public.organization_memberships FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.organization_memberships m
            WHERE m.organization_id = organization_memberships.organization_id
            AND m.user_id = auth.uid()
            AND m.joined_at IS NOT NULL
            AND m.left_at IS NULL
            AND m.deleted_at IS NULL
        )
    );

CREATE POLICY "Admins can manage memberships"
    ON public.organization_memberships FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships m
            WHERE m.organization_id = organization_memberships.organization_id
            AND m.user_id = auth.uid()
            AND m.role_code IN ('owner', 'admin')
            AND m.joined_at IS NOT NULL
            AND m.left_at IS NULL
            AND m.deleted_at IS NULL
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_memberships.organization_id
            AND o.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to memberships"
    ON public.organization_memberships FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================================================
-- DONE!
-- =============================================================================
-- Your database is now ready for MultiTenantKit.
--
-- Next steps:
-- 1. Deploy your Supabase Edge Function with MultiTenantKit SDK
-- 2. Configure toolkitOptions with your custom fields schema
-- 3. Test the API endpoints
-- =============================================================================
