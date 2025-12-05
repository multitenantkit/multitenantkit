# @multitenantkit/sdk

## 0.2.2

### Patch Changes

- fix: add .js extension to imports for Deno compatibility
- Updated dependencies
  - @multitenantkit/adapter-transport-supabase-edge@0.2.2

## 0.2.1

### Patch Changes

- new transport adapter - supabase
- Updated dependencies
  - @multitenantkit/adapter-transport-supabase-edge@0.2.1

## 0.2.0

### Minor Changes

- rename actorUserId to externalId

### Patch Changes

- Updated dependencies
  - @multitenantkit/domain-contracts@0.2.0
  - @multitenantkit/api-handlers@0.2.0
  - @multitenantkit/domain@0.2.0
  - @multitenantkit/adapter-auth-supabase@0.2.0
  - @multitenantkit/adapter-persistence-json@0.2.0
  - @multitenantkit/adapter-persistence-postgres@0.2.0
  - @multitenantkit/adapter-system-crypto-uuid@0.2.0
  - @multitenantkit/adapter-system-system-clock@0.2.0
  - @multitenantkit/adapter-transport-express@0.2.0
  - @multitenantkit/composition@0.2.0
  - @multitenantkit/api-contracts@0.2.0

## 0.1.4

### Patch Changes

- rename `afterExecution` hook to `onSuccess` and prevent its errors from failing the use case
- Updated dependencies
  - @multitenantkit/domain-contracts@0.1.2
  - @multitenantkit/domain@0.1.3

## 0.1.3

### Patch Changes

- simplify Supabase SDK by removing custom interfaces and using standard ToolkitOptions

## 0.1.2

### Patch Changes

- Add Supabase-specific convenience functions and configuration, and add support for custom fields in organization memberships with dynamic schema validation and updated documentation.
- Updated dependencies
  - @multitenantkit/api-handlers@0.1.2
  - @multitenantkit/composition@0.1.2
  - @multitenantkit/domain@0.1.2

## 0.1.1

### Patch Changes

- Initial release
- Updated dependencies
  - @multitenantkit/adapter-auth-supabase@0.1.1
  - @multitenantkit/adapter-persistence-json@0.1.1
  - @multitenantkit/adapter-persistence-postgres@0.1.1
  - @multitenantkit/adapter-system-crypto-uuid@0.1.1
  - @multitenantkit/adapter-system-system-clock@0.1.1
  - @multitenantkit/adapter-transport-express@0.1.1
  - @multitenantkit/api-handlers@0.1.1
  - @multitenantkit/composition@0.1.1
  - @multitenantkit/api-contracts@0.1.1
  - @multitenantkit/domain-contracts@0.1.1
  - @multitenantkit/domain@0.1.1
