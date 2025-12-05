# @multitenantkit/adapter-persistence-supabase

Supabase persistence adapter for MultiTenantKit. Works in both **Node.js** and **Deno/Edge Functions** environments.

## Features

- 🚀 Uses `@supabase/supabase-js` client
- 🦕 Deno/Edge Functions compatible
- 📦 No Node.js-specific APIs (`node:crypto`, `node:fs`, etc.)
- 🔄 Full CRUD operations for Users, Organizations, and OrganizationMemberships
- 🎨 Custom fields support with column mapping
- 📄 Pagination support

## Installation

```bash
npm install @multitenantkit/adapter-persistence-supabase @supabase/supabase-js
```

## Usage

### Basic Setup

```typescript
import { createSupabaseClient, createSupabaseRepositories } from '@multitenantkit/adapter-persistence-supabase';

// Create Supabase client
const client = createSupabaseClient({
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

// Create repositories
const { userRepository, organizationRepository, organizationMembershipRepository } = createSupabaseRepositories({
    client
});

// Use repositories
const user = await userRepository.findByExternalId('user-123');
```

### With Custom Fields and Column Mapping

```typescript
import { createSupabaseRepositories } from '@multitenantkit/adapter-persistence-supabase';

type UserCustomFields = {
    plan: 'free' | 'pro' | 'enterprise';
};

const repos = createSupabaseRepositories<UserCustomFields>({
    client,
    toolkitOptions: {
        namingStrategy: 'snake_case',
        users: {
            database: {
                schema: 'auth',
                table: 'users'
            },
            customFields: {
                customSchema: z.object({
                    plan: z.enum(['free', 'pro', 'enterprise'])
                })
            }
        }
    }
});
```

### In Supabase Edge Functions (Deno)

```typescript
// supabase/functions/api/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SupabaseUserRepository } from 'https://esm.sh/@multitenantkit/adapter-persistence-supabase';

Deno.serve(async (req) => {
    const client = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const userRepo = new SupabaseUserRepository(client);
    const user = await userRepo.findByExternalId('user-123');

    return new Response(JSON.stringify(user), {
        headers: { 'Content-Type': 'application/json' }
    });
});
```

## Database Schema

This adapter expects the following tables in your Supabase database:

### users

```sql
create table users (
    id uuid primary key,
    external_id text unique not null,
    username text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);
```

### organizations

```sql
create table organizations (
    id uuid primary key,
    owner_user_id uuid references users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);
```

### organization_memberships

```sql
create table organization_memberships (
    id uuid primary key,
    user_id uuid references users(id),
    username text not null,
    organization_id uuid references organizations(id),
    role_code text not null check (role_code in ('owner', 'admin', 'member')),
    invited_at timestamptz,
    joined_at timestamptz,
    left_at timestamptz,
    deleted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

## API Reference

### Factory Functions

#### `createSupabaseClient(config)`

Creates a Supabase client instance.

#### `createSupabaseRepositories(options)`

Creates all repositories with shared configuration.

### Repositories

- `SupabaseUserRepository` - User CRUD operations
- `SupabaseOrganizationRepository` - Organization CRUD operations
- `SupabaseOrganizationMembershipRepository` - Membership CRUD operations

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |

## License

MIT
