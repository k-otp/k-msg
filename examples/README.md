# Examples

This directory contains runnable templates for common integration setups.

## Templates (current)

- `hono-pages-send-only`
  - Hono + Cloudflare Pages Functions
  - Advanced send route (`POST /send`, single/batch) + SMS shortcut (`POST /send/sms`)
  - Uses `k-msg` (`KMsg`) + `@k-msg/provider/iwinv`

- `express-node-send-only`
  - Express + Node.js
  - Advanced send route (`POST /send`, single/batch) + SMS shortcut (`POST /send/sms`)
  - Uses `k-msg` (`KMsg`) + `@k-msg/provider`

- `hono-bun-send-only`
  - Hono + Bun (`Bun.serve`)
  - Advanced send route (`POST /send`, single/batch) + SMS shortcut (`POST /send/sms`)
  - Uses `k-msg` (`KMsg`) + `@k-msg/provider`

- `hono-pages-tracking-hyperdrive`
  - Hono + Cloudflare Pages Functions
  - Advanced send route (`POST /send`, single/batch) + tracking (Hyperdrive/Postgres)
  - Requires `nodejs_compat` (current `postgres` driver dependency)
  - Uses `k-msg/adapters/cloudflare` SQL adapter + `@k-msg/messaging/tracking`

- `hono-worker-tracking-d1`
  - Hono + Cloudflare Workers
  - Send + delivery tracking (D1)
  - Uses `createD1DeliveryTrackingStore`

- `hono-worker-queue-do`
  - Hono + Cloudflare Workers
  - Durable Object backed queue for async send
  - Queue in DO storage, send execution in DO alarm/drain loop
  - Uses `@k-msg/provider` (IWINV)
  - No `nodejs_compat` required

## Notes

- These templates are intentionally minimal and focused on wiring.
- Copy one template into your own app and adjust provider/bindings/secrets.
- `k-msg` and `@k-msg/*` dependencies in examples use the npm `latest` tag.
- In templates with advanced `POST /send`, array input is supported and batch responses return `200` with per-item outcomes in `data.results`.
