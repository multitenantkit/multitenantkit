# @multitenantkit/domain

## 0.2.8

### Patch Changes

- refactor: improve organization membership filtering with proper OR logic and LEFT JOIN for pending invitations

## 0.2.7

### Patch Changes

- feat: implement proper joins and data mapping in OrganizationMembershipRepository

## 0.2.6

### Patch Changes

- Add debug logging for customFields propagation

## 0.2.5

### Patch Changes

- supabase repository - public.profiles

## 0.2.4

### Patch Changes

- refactor: change default user table from auth.users to public.profiles

## 0.2.3

### Patch Changes

- feat: add automatic Supabase defaults to adapter factory

## 0.2.2

### Patch Changes

- fix: use npm package path instead of relative monorepo path

## 0.2.1

### Patch Changes

- deno supabase sdk

## 0.2.0

### Minor Changes

- rename actorUserId to externalId

### Patch Changes

- Updated dependencies
  - @multitenantkit/domain-contracts@0.2.0

## 0.1.3

### Patch Changes

- rename `afterExecution` hook to `onSuccess` and prevent its errors from failing the use case
- Updated dependencies
  - @multitenantkit/domain-contracts@0.1.2

## 0.1.2

### Patch Changes

- Add Supabase-specific convenience functions and configuration, and add support for custom fields in organization memberships with dynamic schema validation and updated documentation.

## 0.1.1

### Patch Changes

- Initial release
- Updated dependencies
  - @multitenantkit/domain-contracts@0.1.1
