---
npm/@k-msg/webhook: minor
---

Rewrite `@k-msg/webhook` around a runtime-first DX flow and add Cloudflare D1 persistence adapters.

> Note: This release includes intentional breaking changes but is versioned as `minor` by repository policy.

## Highlights

- root exports are now runtime-focused (`WebhookRuntimeService`, in-memory persistence helpers)
- advanced classes moved to `@k-msg/webhook/toolkit`
- new Cloudflare adapter subpath: `@k-msg/webhook/adapters/cloudflare`
  - `createD1WebhookPersistence`
  - `buildWebhookSchemaSql`
  - `initializeWebhookSchema`
- endpoint registration no longer auto-sends probe webhooks
- metadata filter matching now fail-close when required keys are missing
- private-host URL policy defaults to deny unless explicitly allowed

## Migration

- replace root `WebhookService` usage with `WebhookRuntimeService`
- import advanced classes from `@k-msg/webhook/toolkit`
- call `probeEndpoint()` explicitly when you need endpoint probe checks
