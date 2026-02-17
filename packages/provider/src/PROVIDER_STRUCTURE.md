# Provider Structure Guide

This package uses a modular provider structure so each vendor implementation can stay maintainable as capabilities grow.

## Target Shape

Each provider directory should follow this pattern:

- `provider.ts`: public facade only
- `<provider>.send.ts`: message send domain
- `<provider>.delivery.ts`: delivery status domain (if supported)
- `<provider>.template.ts`: template CRUD/inspection domain (if supported)
- `<provider>.kakao.ts` (or channel-specific module): channel lifecycle domain (if supported)
- `<provider>.helpers.ts`: provider-local normalization/parsing helpers
- `<provider>.http.ts`: provider-local HTTP transport wrappers
- `<provider>.error.ts`: vendor-to-`KMsgError` mapping
- `<provider>.internal.types.ts`: internal-only shared types for the provider modules

## Facade Responsibilities (`provider.ts`)

`provider.ts` should only keep:

- constructor/config normalization
- provider metadata (`id`, `name`, `supportedTypes`)
- onboarding spec exposure (`getOnboardingSpec`)
- lightweight health check
- public method delegation to domain modules
- factory exports (`create*Provider`, `createDefault*Provider`, `*ProviderFactory`)

Avoid keeping vendor request/response logic directly inside `provider.ts`.

## Shared Utility Promotion Rules

Move logic to `src/shared/*` only when all conditions are true:

1. It is vendor-neutral.
2. It is used by at least two providers.
3. The abstraction does not leak one vendor's response shape.

Examples:

- `shared/type-guards.ts` (`isObjectRecord`)
- `shared/http-json.ts` (`safeParseJson`, `toRecordOrFallback`)

## Testing Rules

- Keep tests focused on public provider contracts (existing `provider.test.ts` style).
- Avoid exporting internal helper functions only for test convenience.
- Preserve existing integration test entry points.
- When refactoring, ensure package-level export boundary tests still pass.

## Refactor Checklist

1. Extract helper/domain modules from `provider.ts`.
2. Rewire `provider.ts` to delegate only.
3. Keep public API names and signatures unchanged.
4. Run formatter/lint.
5. Run `packages/provider` build + unit tests.
6. Run workspace typecheck.
