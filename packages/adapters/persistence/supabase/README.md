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

> 💡 **For a complete solution** including use cases and system adapters, use `@multitenantkit/sdk-supabase` instead. This package provides only the persistence layer (repositories).

## Usage

### Quick Start with SDK (Recommended)

For most users, we recommend using the complete Supabase SDK:

```typescript
import { createSupabaseAdapters, createUseCases } from '@multitenantkit/sdk-supabase';
import { createClient } from '@supabase/supabase-js';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const { adapters, toolkitOptions } = createSupabaseAdapters({ client });
const useCases = createUseCases(adapters, toolkitOptions);
```

### Using Repositories Directly

```typescript
import { createSupabaseClient, createSupabaseRepositories } from '@multitenantkit/adapter-persistence-supabase';

// Create Supabase client
const client = createSupabaseClient({
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
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

### Using in Supabase Edge Functions (Deno)

For Edge Functions, use the complete SDK which handles Deno-specific setup:

```typescript
// supabase/functions/api/index.ts
import { createSupabaseAdapters, createUseCases } from '@multitenantkit/sdk-supabase';
import { buildEdgeFunction } from '@multitenantkit/adapter-transport-supabase-edge';
import { createClient } from '@supabase/supabase-js';

const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const { adapters, toolkitOptions } = createSupabaseAdapters({ client });
const useCases = createUseCases(adapters, toolkitOptions);
// ... build handlers and start server
```

### Using Repositories Directly (Advanced)

For advanced use cases where you only need the repositories:

```typescript
import { createClient } from '@supabase/supabase-js';
import { SupabaseUserRepository } from '@multitenantkit/adapter-persistence-supabase';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const userRepo = new SupabaseUserRepository(client);
const user = await userRepo.findByExternalId('user-123');
```

## Database Schema

This adapter expects the following tables in your Supabase database.

> 💡 For a complete migration script with indexes, triggers, and RLS policies, see the `000_full_setup.sql` file in the MultiTenantKit repository.

### profiles (users)

By default, the SDK uses `public.profiles` instead of `auth.users` because `auth.users` is not accessible via PostgREST.

```sql
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    external_id text not null,
    username text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    -- Add your custom fields here
    first_name text,
    last_name text
);
```

### organizations

```sql
create table public.organizations (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid references public.profiles(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz,
    deleted_at timestamptz,
    -- Add your custom fields here
    name text not null,
    slug text unique
);
```

### organization_memberships

```sql
create table public.organization_memberships (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id),
    username text not null,
    organization_id uuid not null references public.organizations(id),
    role_code text not null default 'member',
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
