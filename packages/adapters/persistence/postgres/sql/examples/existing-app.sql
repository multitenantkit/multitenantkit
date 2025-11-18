-- MultiTenantKit Schema for Existing Applications
-- ================================================
--
-- This example shows how to integrate MultiTenantKit with an existing application
-- that already has a users table and authentication system.
--
-- Scenario:
--   - You have a legacy app with a "members" table for users
--   - You want to add team/organization management
--   - You want to keep your existing user system
--
-- Approach:
--   - Keep your existing "members" table (no need to migrate)
--   - Create organizations and organization_memberships tables
--   - Use columnMapping to map framework fields to your existing columns
--

-- =====================
-- Existing Users Table (for reference)
-- =====================
-- This represents YOUR existing table - DON'T run this,
-- it's just to show what your existing structure might look like:
/*
CREATE TABLE members (
    member_id SERIAL PRIMARY KEY,           -- Your existing ID column
    auth_user_id VARCHAR(255) NOT NULL,     -- Your auth provider ID
    email_address VARCHAR(255) NOT NULL,    -- Your email column
    full_name VARCHAR(255),
    profile_photo TEXT,
    date_created TIMESTAMP DEFAULT NOW(),
    date_modified TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);
*/

-- =====================
-- New Organizations Table
-- =====================
-- This is NEW - we create this to add team functionality
CREATE TABLE IF NOT EXISTS teams (  -- Using "teams" as the table name (your preference)
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_member_id INTEGER NOT NULL,  -- References your existing members.member_id
    date_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_archived TIMESTAMPTZ,
    date_deleted TIMESTAMPTZ,

    -- Custom fields
    team_name VARCHAR(100) NOT NULL,
    team_description TEXT,

    -- Foreign key to your existing members table
    CONSTRAINT fk_teams_owner_member_id FOREIGN KEY (owner_member_id)
        REFERENCES members(member_id) ON DELETE RESTRICT
);

CREATE INDEX idx_teams_owner_member_id ON teams(owner_member_id) WHERE date_deleted IS NULL;
CREATE INDEX idx_teams_date_deleted ON teams(date_deleted);

-- =====================
-- New Organization Memberships Table
-- =====================
CREATE TABLE IF NOT EXISTS team_members (  -- Using "team_members" as the table name
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id INTEGER,  -- References your existing members.member_id
    member_email VARCHAR(255) NOT NULL,
    team_id UUID NOT NULL,
    member_role VARCHAR(50) NOT NULL,
    date_invited TIMESTAMPTZ,
    date_joined TIMESTAMPTZ,
    date_left TIMESTAMPTZ,
    date_deleted TIMESTAMPTZ,
    date_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_team_members_member_id FOREIGN KEY (member_id)
        REFERENCES members(member_id) ON DELETE RESTRICT,
    CONSTRAINT fk_team_members_team_id FOREIGN KEY (team_id)
        REFERENCES teams(team_id) ON DELETE CASCADE,
    CONSTRAINT chk_member_role CHECK (member_role IN ('owner', 'admin', 'member')),
    CONSTRAINT uq_member_team_active UNIQUE (member_id, team_id, date_deleted)
);

CREATE INDEX idx_team_members_member_id ON team_members(member_id) WHERE date_deleted IS NULL;
CREATE INDEX idx_team_members_team_id ON team_members(team_id) WHERE date_deleted IS NULL;

-- =====================
-- Application Configuration
-- =====================
-- This is how you configure MultiTenantKit to work with your existing schema:
/*
import { FrameworkConfig } from '@multitenantkit/sdk';
import { z } from 'zod';

const frameworkConfig: FrameworkConfig = {
  users: {
    database: {
      schema: 'public',
      table: 'members'  // Your existing table name
    },
    customFields: {
      columnMapping: {
        // Map framework field names to YOUR column names
        id: 'member_id',              // Framework's id → your member_id
        externalId: 'auth_user_id',   // Framework's externalId → your auth_user_id
        username: 'email_address',    // Framework's username → your email_address
        createdAt: 'date_created',    // Framework's createdAt → your date_created
        updatedAt: 'date_modified',   // Framework's updatedAt → your date_modified
        deletedAt: 'date_deleted'     // Framework's deletedAt → your is_deleted (you may need a migration)
      },
      customSchema: z.object({
        fullName: z.string(),
        profilePhoto: z.string().optional()
      }),
      customMapper: {
        toDb: (fields) => ({
          full_name: fields.fullName,
          profile_photo: fields.profilePhoto
        }),
        toDomain: (dbRow) => ({
          fullName: dbRow.full_name,
          profilePhoto: dbRow.profile_photo
        })
      }
    }
  },

  organizations: {
    database: {
      schema: 'public',
      table: 'teams'  // Your new teams table
    },
    customFields: {
      columnMapping: {
        id: 'team_id',
        ownerUserId: 'owner_member_id',
        createdAt: 'date_created',
        updatedAt: 'date_modified',
        archivedAt: 'date_archived',
        deletedAt: 'date_deleted'
      },
      customSchema: z.object({
        teamName: z.string(),
        teamDescription: z.string().nullable()
      }),
      customMapper: {
        toDb: (fields) => ({
          team_name: fields.teamName,
          team_description: fields.teamDescription
        }),
        toDomain: (dbRow) => ({
          teamName: dbRow.team_name,
          teamDescription: dbRow.team_description
        })
      }
    }
  },

  organizationMemberships: {
    database: {
      schema: 'public',
      table: 'team_members'  // Your new team_members table
    },
    customFields: {
      columnMapping: {
        id: 'membership_id',
        userId: 'member_id',
        username: 'member_email',
        organizationId: 'team_id',
        roleCode: 'member_role',
        invitedAt: 'date_invited',
        joinedAt: 'date_joined',
        leftAt: 'date_left',
        createdAt: 'date_created',
        updatedAt: 'date_modified',
        deletedAt: 'date_deleted'
      }
    }
  }
};
*/

-- =====================
-- Notes
-- =====================
--
-- 1. DELETED/ARCHIVED HANDLING:
--    If your existing table uses a boolean "is_deleted" instead of a timestamp,
--    you may need to add a date_deleted column:
--
--    ALTER TABLE members ADD COLUMN date_deleted TIMESTAMPTZ;
--    UPDATE members SET date_deleted = NOW() WHERE is_deleted = TRUE;
--
-- 2. TYPE MISMATCHES:
--    If your ID columns use INTEGER/SERIAL instead of UUID, that's fine!
--    The framework works with any type - just make sure foreign keys match.
--
-- 3. CASCADING DELETES:
--    Adjust ON DELETE behavior based on your business rules:
--    - RESTRICT: Prevent deletion if references exist
--    - CASCADE: Delete related records automatically
--    - SET NULL: Set foreign key to NULL
--
-- 4. EXISTING DATA:
--    The new tables (teams, team_members) start empty.
--    If you need to migrate existing team data, write a separate migration script.
