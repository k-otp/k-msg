---
title: "Cloudflare Worker: delivery tracking with Hyperdrive"
description: "Generated from `examples/cloudflare-worker-hyperdrive/README.md`"
---
A Hono Worker that sends SMS/LMS with k-msg, records every accepted message
in Postgres through Hyperdrive, and asks the provider for delivery status from
a cron trigger.

## What this shows

- `POST /messages` validates `{"to", "text"}`, sends with `KMsg` and a
  10-second timeout, and records the send with `createDeliveryTrackingHooks`
  in a `HyperdriveDeliveryTrackingStore` from
  `@k-msg/messaging/adapters/cloudflare`.
- `GET /messages/:messageId` returns the tracked status.
- A `scheduled` handler, run every minute by a cron trigger, calls
  `DeliveryTrackingService.runOnce()` to check messages that are due, and
  `onStatusChange` logs every status change with the phone number masked.
- Each request and each cron run opens its own postgres.js client and closes
  it with `ctx.waitUntil(sql.end())`; Hyperdrive pools the real connections.
- The table comes from a committed `sql/schema.sql`, generated with the
  library's `buildDeliveryTrackingSchemaSql()` and applied with `psql`.
  Nothing is created at request time, so the Worker's database user needs no
  `CREATE` privilege.
- Every endpoint requires a bearer token, compared in constant time. The
  sender number comes from configuration, never from the request. Provider
  errors become 429, 502 or 503 responses without the provider's own text.
- `KMSG_PROVIDER` selects the provider: `mock` (the default; it sends nothing
  and reports every message as delivered), `iwinv`, `solapi` or `aligo`.

## Run it locally

You need [Bun](https://bun.sh) (or npm), `openssl`, and a Postgres database.
With Docker:

```bash
cd examples/cloudflare-worker-hyperdrive
bun install

docker run -d --name kmsg-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=kmsg postgres:17
# Give the container a few seconds to start, then create the table:
psql "postgres://postgres:postgres@localhost:5432/kmsg" -f sql/schema.sql
```

Without a local `psql`, run
`docker exec -i kmsg-postgres psql -U postgres -d kmsg < sql/schema.sql`
instead. `wrangler dev` connects to the `localConnectionString` in
`wrangler.jsonc`, which points at this database; to use another one, set
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`.

Start the Worker:

```bash
echo "API_TOKEN=$(openssl rand -hex 32)" > .dev.vars
bun run dev
```

In a second terminal, send a message:

```bash
cd examples/cloudflare-worker-hyperdrive
export API_TOKEN=$(sed -n 's/^API_TOKEN=//p' .dev.vars)

curl -i http://localhost:8787/messages \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"010-1234-5678","text":"Your order has shipped"}'
```

```http
HTTP/1.1 202 Accepted
Location: /messages/30dbcf60-f6ff-4dd0-b9c9-b06b80896975
Content-Type: application/json

{"messageId":"30dbcf60-f6ff-4dd0-b9c9-b06b80896975","type":"SMS","status":"SENT"}
```

The message is now a row in `kmsg_delivery_tracking` with status `SENT`, and
its first status check is due 30 seconds later. `wrangler dev` does not run
cron triggers by itself, so after 30 seconds run the cron once:

```bash
curl "http://localhost:8787/cdn-cgi/local/scheduled"
```

The mock provider reports the message as delivered, and the `wrangler dev`
terminal logs the change:

```json
{"level":"info","message":"delivery status changed","messageId":"30dbcf60-f6ff-4dd0-b9c9-b06b80896975","providerId":"mock","previousStatus":"SENT","status":"DELIVERED","to":"010****5678","providerStatusCode":null}
```

Read the tracked status, using the `messageId` you got:

```bash
curl http://localhost:8787/messages/30dbcf60-f6ff-4dd0-b9c9-b06b80896975 \
  -H "Authorization: Bearer $API_TOKEN"
```

```json
{"messageId":"30dbcf60-f6ff-4dd0-b9c9-b06b80896975","providerId":"mock","type":"SMS","status":"DELIVERED","providerStatusCode":null,"providerStatusMessage":null,"requestedAt":"2026-09-26T13:47:02.073Z","statusUpdatedAt":"2026-09-26T13:47:47.585Z","sentAt":"2026-09-26T13:47:02.073Z","deliveredAt":"2026-09-26T13:47:02.073Z","failedAt":null}
```

And the row itself:

```bash
psql "postgres://postgres:postgres@localhost:5432/kmsg" \
  -c 'SELECT message_id, status, requested_at, delivered_at, attempt_count FROM kmsg_delivery_tracking'
```

The mock provider remembers what it sent only in memory. After `wrangler dev`
restarts, it no longer finds earlier messages, so their rows stay `SENT` until
tracking gives up on them.

## Use a real provider

Add the provider, its keys, and a sender number registered with that provider
to `.dev.vars`, then restart `bun run dev`. For example:

```ini
API_TOKEN=...
KMSG_PROVIDER=iwinv
KMSG_SENDER_NUMBER=0212345678
IWINV_API_KEY=...
IWINV_SMS_API_KEY=...
IWINV_SMS_AUTH_KEY=...
IWINV_SMS_COMPANY_ID=...
```

| `KMSG_PROVIDER` | Required secrets | Delivery status |
| --- | --- | --- |
| `mock` (default) | none | Reports every message it sent as `DELIVERED`. |
| `iwinv` | `IWINV_API_KEY`, `IWINV_SMS_API_KEY`, `IWINV_SMS_AUTH_KEY`, `IWINV_SMS_COMPANY_ID` | Polled; SMS status lookups need the company id. `IWINVProvider` needs the AlimTalk key even for SMS. |
| `solapi` | `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` | Polled. |
| `aligo` | `ALIGO_API_KEY`, `ALIGO_USER_ID` | Aligo has no status lookup, so its messages become `UNKNOWN` at the first check. `ALIGO_TEST_MODE=true` validates requests without sending them. |

Every provider except `mock` also needs `KMSG_SENDER_NUMBER`, digits only
(hyphens are removed). Korean carriers only deliver from sender numbers
registered with the provider in advance. From here on, messages are really
sent, so test with your own phone number. `.dev.vars.example` lists every
variable.

## Endpoints

Every endpoint needs `Authorization: Bearer <API_TOKEN>`. Errors look like
`{"error":{"code":"INVALID_INPUT","message":"..."}}`.

| Endpoint | What it does | Success response |
| --- | --- | --- |
| `POST /messages` | Sends a message and records it for tracking. | `202 {"messageId","type","status"}` with a `Location` header. |
| `GET /messages/:messageId` | Returns the tracked status of a message. | `200` with the status (above). |

`POST /messages` takes `{"to": "01012345678", "text": "..."}` and nothing
else: `to` is a Korean mobile number (hyphens and spaces are allowed), `text`
is at most 2,000 bytes with non-ASCII characters counted as 2, and a text over
90 bytes is sent as LMS. A `from` field is rejected. The body may be at most
16 KiB. `:messageId` is the UUID that `POST /messages` returned.

A tracked `status` is `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `CANCELLED`
or `UNKNOWN`; the last four are final.

| Status | Code | When |
| --- | --- | --- |
| 400 | `INVALID_JSON` | The body is not JSON. |
| 400 | `INVALID_INPUT` | A field is missing, invalid or unexpected, or the id is not a UUID. |
| 401 | `UNAUTHORIZED` | The bearer token is missing or wrong. |
| 404 | `NOT_FOUND` | Unknown route, or no tracked message has this id. |
| 413 | `PAYLOAD_TOO_LARGE` | The body is over 16 KiB. |
| 429 | `RATE_LIMIT_EXCEEDED` | The provider is rate limiting; `Retry-After` says when to retry if the provider said. |
| 502 | the provider's `KMsgErrorCode`, such as `AUTHENTICATION_FAILED` | The provider refused the message. |
| 503 | `NETWORK_TIMEOUT` | The provider did not answer within 10 seconds. It may still have sent the message. |
| 503 | `NETWORK_ERROR`, `NETWORK_SERVICE_UNAVAILABLE` | The provider could not be reached. |
| 500 | `CONFIGURATION_ERROR` | A variable, secret or binding is missing or invalid; the Worker logs name it. |
| 500 | `INTERNAL_ERROR` | Anything else, such as the database being unreachable. |

The provider's own error text is logged, never returned.

## How tracking works

- Each message the provider accepts is written to `kmsg_delivery_tracking`
  with status `SENT`, and its first check is due 30 seconds later. A failed
  send is not recorded.
- Every minute the cron checks up to 200 due messages, 10 at a time, and
  stores the new status. Unresolved messages are checked again after 30
  seconds, 2 minutes, 10 minutes, 30 minutes, then every 2 hours, and become
  `UNKNOWN` after 24 hours. These are the library's default polling settings.
- `sql/schema.sql` is generated from `src/tracking-schema.ts`, the options
  the store itself uses. After changing them, regenerate the file with
  `bun scripts/print-schema.ts > sql/schema.sql` and apply the change to the
  database yourself. The schema differs from the library's default only in
  its `TIMESTAMPTZ` timestamps. `last_error` and `metadata` are `JSONB`, so
  SQL can read them, for example
  `SELECT message_id FROM kmsg_delivery_tracking WHERE last_error->>'code' = 'NETWORK_TIMEOUT'`.
- A table created by an earlier version of this example keeps `last_error`
  and `metadata` as `TEXT`, because `CREATE TABLE IF NOT EXISTS` leaves an
  existing table alone. The Worker still works with it, since Postgres stores
  the `JSONB` values it writes to a `TEXT` column as text, but the query above
  needs `JSONB`. Convert the two columns once, as the table's owner. This
  rewrites the table and blocks writes while it runs:

  ```sql
  ALTER TABLE kmsg_delivery_tracking
    ALTER COLUMN last_error TYPE JSONB USING last_error::jsonb,
    ALTER COLUMN metadata TYPE JSONB USING metadata::jsonb;
  ```

  Its other `TEXT` columns can stay: they hold anything the `VARCHAR(64)`
  columns of the current schema do.
- The store normally runs `CREATE TABLE` and `CREATE INDEX IF NOT EXISTS` on
  first use. This Worker turns that off with `initializeSchema: false` in
  `src/tracking.ts`, so create the table before the first deploy.

## Deploy

```bash
bunx wrangler login

# 1. Create the table, connected as the database owner.
psql "$DATABASE_URL" -f sql/schema.sql

# 2. Create a role for the Worker that can only read and write that table.
psql "$DATABASE_URL" <<'SQL'
CREATE ROLE kmsg_worker LOGIN PASSWORD 'a-long-random-password';
GRANT SELECT, INSERT, UPDATE ON kmsg_delivery_tracking TO kmsg_worker;
SQL

# 3. Create a Hyperdrive configuration for that role. Caching is off because
#    every read here is a status that should be fresh. Copy the printed id
#    into "hyperdrive" in wrangler.jsonc.
bunx wrangler hyperdrive create kmsg-tracking --caching-disabled \
  --connection-string="postgres://kmsg_worker:a-long-random-password@db.example.com:5432/kmsg"

# 4. Store the secrets.
bunx wrangler secret put API_TOKEN          # paste the output of: openssl rand -hex 32
bunx wrangler secret put IWINV_API_KEY      # the secrets of your provider
bunx wrangler secret put IWINV_SMS_API_KEY
bunx wrangler secret put IWINV_SMS_AUTH_KEY
bunx wrangler secret put IWINV_SMS_COMPANY_ID
```

Set `KMSG_PROVIDER` and `KMSG_SENDER_NUMBER` in the `vars` of
`wrangler.jsonc`, then deploy. The cron trigger in `wrangler.jsonc` is
deployed with the Worker.

```bash
bun run deploy
```

## Production checklist

- Generate `API_TOKEN` with `openssl rand -hex 32`, keep it in a secret, and
  give it only to the services that send messages.
- Register `KMSG_SENDER_NUMBER` with your provider before going live.
- Connect Hyperdrive as a role that can only `SELECT`, `INSERT` and `UPDATE`
  the tracking table, as in the deploy steps.
- Keep Hyperdrive caching off for this Worker; with the default 60-second
  cache, `GET /messages/:messageId` can return an old status.
- The table grows by one row per message. Delete rows you no longer need on a
  schedule, for example
  `DELETE FROM kmsg_delivery_tracking WHERE requested_at < now() - interval '90 days'`,
  with the retention period your business requires.
- A send is not retried here. After `503 NETWORK_TIMEOUT` the provider may
  already have the message, so a client that retries can cause a duplicate;
  add an idempotency key, as in `cloudflare-worker-queue-do`, if clients
  retry.
- The cron checks at most 200 messages a minute. For more, pass a larger
  `polling.batchSize` to `DeliveryTrackingService` in `src/tracking.ts`.
- Status checks have no timeout of their own, and the SOLAPI SDK ignores the
  abort signal, so a provider that hangs can hold up a cron run or a send.
- IWINV and Aligo can restrict their APIs to registered server IP addresses,
  and Workers do not send from fixed IPs. Check your account's IP settings.
- Alert on `send failed`, `could not record a sent message` and
  `delivery status poll failed` in Workers Logs (enabled by `observability`
  in `wrangler.jsonc`).

