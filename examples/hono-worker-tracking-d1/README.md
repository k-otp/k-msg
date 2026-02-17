# Hono Worker: Tracking with D1

Cloudflare Workers + Hono example for:
- message send via `k-msg` (`KMsg`)
- delivery tracking persistence via D1

## Setup

```bash
cd examples/hono-worker-tracking-d1
bun install
cp .dev.vars.example .dev.vars
```

Fill `.dev.vars`:

```ini
IWINV_API_KEY=...
IWINV_SMS_API_KEY=...
IWINV_SMS_AUTH_KEY=...
IWINV_SMS_SENDER_NUMBER=01000000000
TRACKING_ADMIN_TOKEN=local-admin-token
```

## D1 binding

Update `wrangler.jsonc`:

- `d1_databases[0].database_name`
- `d1_databases[0].database_id`

`DeliveryTrackingService.init()` creates required tables/indexes automatically.

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

- `POST /send/sms`
- `GET /tracking/:messageId`
- `POST /tracking/run-once`

## Sample requests

Send:

```bash
curl -X POST http://127.0.0.1:8787/send/sms \
  -H "content-type: application/json" \
  -d '{
    "to":"01012345678",
    "text":"hello from d1 tracking",
    "from":"01000000000"
  }'
```

Get tracking record:

```bash
curl http://127.0.0.1:8787/tracking/<MESSAGE_ID>
```

Run one tracking poll pass:

```bash
curl -X POST http://127.0.0.1:8787/tracking/run-once \
  -H "x-admin-token: local-admin-token"
```
