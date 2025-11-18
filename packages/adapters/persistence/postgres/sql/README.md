# MultiTenantKit PostgreSQL Schema

This directory contains SQL scripts for setting up the database schema required by MultiTenantKit.

## Quick Start

### 1. Run the Schema Script

```bash
psql -d your_database -f schema.sql
```

### 2. Configure Your Environment

```env
DATABASE_URL=postgresql://user:password@localhost:5432/your_database
```

## Files

- **`schema.sql`** - Complete database schema with all required tables and indexes
- **`examples/`** - Example schemas for common use cases (see below)

## Understanding the Schema

MultiTenantKit requires three main tables:

### 1. `users`
Stores individual user accounts. Maps to your authentication provider.

**Key columns:**
- `id` - Internal UUID
- `external_id` - Auth provider user ID (Supabase, Auth0, etc.)
- `username` - User identifier (email, nickname, phone, etc.)

### 2. `organizations`
Stores teams/organizations.

**Key columns:**
- `id` - Organization UUID
- `owner_user_id` - Reference to the owner user

### 3. `organization_memberships`
Many-to-many relationship between users and organizations with roles.

**Key columns:**
- `user_id` - Reference to user
- `organization_id` - Reference to organization
- `role_code` - User's role ('owner', 'admin', 'member')

## Common Scenarios

### Scenario 1: New Application with Supabase Auth

If you're using Supabase, you typically use the `auth.users` table for users:

1. **Don't create a separate users table**
2. **Create only organizations and organization_memberships:**

```sql
-- Run only the organizations and organization_memberships sections from schema.sql
```

3. **Configure columnMapping:**

```typescript
const frameworkConfig: FrameworkConfig = {
  users: {
    database: {
      schema: 'auth',
      table: 'users'
    },
    customFields: {
      columnMapping: {
        externalId: 'id',      // auth.users.id
        username: 'email'       // auth.users.email
      }
    }
  }
};
```

### Scenario 2: New Application with Custom Auth

1. **Run the complete schema.sql**
2. **Add custom columns** for your application
3. **Configure custom fields:**

```typescript
const frameworkConfig: FrameworkConfig = {
  users: {
    customFields: {
      customSchema: z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email()
      })
    }
  }
};
```

### Scenario 3: Existing Application Integration

If you already have tables, you have two options:

**Option A: Use your existing tables with columnMapping**

```typescript
const frameworkConfig: FrameworkConfig = {
  users: {
    database: {
      schema: 'public',
      table: 'my_users'  // Your existing table name
    },
    customFields: {
      columnMapping: {
        id: 'user_id',              // Map framework id to your user_id
        externalId: 'auth_user_id', // Map to your auth column
        username: 'email'           // Map to your email column
      }
    }
  }
};
```

**Option B: Create new tables and sync them**

Run `schema.sql` to create new tables and sync data from your existing tables.

## Adding Custom Fields

The base schema includes only framework columns. Add your application-specific columns:

```sql
-- Add custom columns to users
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL;
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Add custom columns to organizations
ALTER TABLE organizations ADD COLUMN name VARCHAR(100) NOT NULL;
ALTER TABLE organizations ADD COLUMN description TEXT;
ALTER TABLE organizations ADD COLUMN logo_url TEXT;
```

Then configure them in your application:

```typescript
const customUserFields = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().url().optional()
});

const frameworkConfig: FrameworkConfig = {
  namingStrategy: 'snake_case',  // Auto-converts firstName ↔ first_name
  users: {
    customFields: {
      customSchema: customUserFields
    }
  }
};
```

## Naming Strategies

If your database uses `snake_case` but your application uses `camelCase`:

```typescript
const frameworkConfig: FrameworkConfig = {
  namingStrategy: 'snake_case'  // Global setting for all entities
};
```

This automatically converts:
- `firstName` ↔ `first_name`
- `avatarUrl` ↔ `avatar_url`
- etc.

Base framework fields already use snake_case in the database (`external_id`, `created_at`).

## Verifying Your Setup

After running the schema, verify the tables were created:

```sql
-- Check if tables exist
\dt

-- Verify users table structure
\d users

-- Verify organizations table structure
\d organizations

-- Verify organization_memberships table structure
\d organization_memberships
```

## Missing Columns Error

If you get an error like:
```
column "first_name" does not exist
```

This means:
1. Your custom fields schema defines `firstName`
2. But the database column `first_name` doesn't exist
3. And no `customMapper` or `columnMapping` is configured

**Solution:**
- Add the column: `ALTER TABLE users ADD COLUMN first_name VARCHAR(100);`
- Or configure a mapping to an existing column
- Or configure `namingStrategy: 'snake_case'` to auto-convert

## Future: CLI Tool

We're working on a CLI tool that will:
- ✅ Auto-generate schema from your custom fields config
- ✅ Detect missing columns and suggest ALTER TABLE commands
- ✅ Validate your database matches your configuration
- ✅ Generate migrations for schema changes

Until then, refer to this documentation and the example schemas.

## Examples Directory

See the `examples/` directory for complete schema examples:
- `supabase.sql` - Supabase Auth integration
- `custom-auth.sql` - Custom authentication setup
- `existing-app.sql` - Integrating with existing tables

## Need Help?

- Check the main documentation: [ARCHITECTURE.md](../../../../../.idea/docs/ARCHITECTURE.md)
- See the usage example: [.idea/use-example/](../../../../../.idea/use-example/)
- Open an issue on GitHub
