# Hono Pages: Tracking with Hyperdrive

Cloudflare Pages Functions + Hono example for:
- message send via `k-msg` (`KMsg`)
- delivery tracking persistence via Hyperdrive (Postgres)
- provider: IWINV

## Important

- This template currently requires `nodejs_compat`.
- Reason: the `postgres` driver used for Hyperdrive depends on Node compatibility APIs.

## Setup

```bash
cd examples/hono-pages-tracking-hyperdrive
bun install
cp .dev.vars.example .dev.vars
```

Fill `.dev.vars`:

```ini
IWINV_API_KEY=...
IWINV_SMS_API_KEY=...
IWINV_SMS_AUTH_KEY=...
IWINV_SMS_SENDER_NUMBER=01000000000
INTERNAL_CRON_TOKEN=local-cron-token
```

## Hyperdrive binding

Update `wrangler.jsonc`:

- `hyperdrive[0].id`: your real Hyperdrive ID
- `hyperdrive[0].localConnectionString`: local Postgres URL for `wrangler pages dev`

This template uses `postgres` (postgres.js) to connect Hyperdrive, so
`nodejs_compat` is enabled in `wrangler.jsonc`.

Example local DB URL:

```txt
postgres://postgres:postgres@127.0.0.1:5432/kmsg_tracking
```

`DeliveryTrackingService.init()` will create required tables/indexes automatically.

### Tracking schema

Table: `kmsg_delivery_tracking`

- PK: `message_id`
- Core: `provider_id`, `provider_message_id`, `type`, `to`, `from`, `status`
- Timing: `requested_at`, `status_updated_at`, `next_check_at`, `sent_at`, `delivered_at`, `failed_at`, `last_checked_at`, `scheduled_at`
- Metadata: `attempt_count`, `provider_status_code`, `provider_status_message`, `last_error`, `raw`, `metadata`

Indexes:

- `idx_kmsg_delivery_due(status, next_check_at)`
- `idx_kmsg_delivery_provider_msg(provider_id, provider_message_id)`
- `idx_kmsg_delivery_requested_at(requested_at)`

## Run local dev

```bash
bun run dev
```

## Routes

- `POST /send` (advanced: raw `SendInput`)
- `POST /send/sms`
- `GET /tracking/:messageId`
- `POST /internal/tracking/run-once`

## Sample requests

Advanced send:

```bash
curl -X POST http://127.0.0.1:8788/send \
  -H "content-type: application/json" \
  -d '{
    "type":"SMS",
    "to":"01012345678",
    "text":"hello from advanced send route",
    "from":"01000000000",
    "providerId":"iwinv"
  }'
```

SMS shortcut send:

```bash
curl -X POST http://127.0.0.1:8788/send/sms \
  -H "content-type: application/json" \
  -d '{
    "to":"01012345678",
    "text":"hello from hyperdrive tracking",
    "from":"01000000000"
  }'
```

Get tracking record:

```bash
curl http://127.0.0.1:8788/tracking/<MESSAGE_ID>
```

Run one tracking poll pass:

```bash
curl -X POST http://127.0.0.1:8788/internal/tracking/run-once \
  -H "x-cron-token: local-cron-token"
```
