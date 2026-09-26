---
title: "Cloudflare Worker with D1: send, track, notify"
description: "Generated from `examples/cloudflare-worker-d1/README.md`"
---
A Cloudflare Worker (Hono) that sends text messages through k-msg, records
each send in D1, polls delivery status from a Cron Trigger, and reports every
status change to your systems as a signed webhook.

## What this shows

- `KMsg.send` behind an authenticated API, with the provider chosen by
  configuration: `mock` (default, works offline), `iwinv`, `solapi` or
  `aligo`. The sender number comes from configuration, never from the request.
- Delivery tracking in D1: `createDeliveryTrackingHooks` records each send
  through `createD1DeliveryTrackingStore`.
- A Cron Trigger that runs `DeliveryTrackingService.runOnce()` and turns each
  status change (`onStatusChange`) into a webhook with
  `WebhookRuntimeService.emitSync`, inside the cron invocation. No timers run
  in the Worker.
- Webhook endpoints stored in D1 (`createD1WebhookPersistence`), HTTPS and
  public hosts only, each with its own signing secret.
- A sample receiver that verifies the signature and timestamp with the
  library's `SecurityManager` and skips repeated events.
- Tables created by committed D1 migrations that were generated with the
  library's schema builders, not at request time.

## How it fits together

```text
POST /messages -> KMsg.send -> provider
                    '-> tracking hook -> D1 kmsg_delivery_tracking
               '-> waitUntil: first status webhook (message.sent)

cron, every minute -> DeliveryTrackingService.runOnce -> provider status lookup
                        '-> onStatusChange -> emitSync -> signed POST to each endpoint
                                                 '-> D1 kmsg_webhook_deliveries
```

| File | Purpose |
| --- | --- |
| `src/index.ts` | Routes, error handling and the `scheduled` handler |
| `src/env.ts` | Checks bindings, vars and secrets on every request and cron run |
| `src/providers.ts` | Creates the provider `KMSG_PROVIDER` selects |
| `src/runtime.ts` | Builds `KMsg`, the tracking service and the status webhooks per request |
| `src/webhooks.ts` | Webhook runtime, URL rules, signing and verification |
| `src/http.ts` | Bearer authentication, JSON body reading, send error mapping |
| `src/validation.ts` | Request body checks |
| `migrations/` | D1 schema |

Each request and cron run builds its own `KMsg`, tracking service and webhook
runtime from the bindings. Nothing that holds I/O state is kept in module
scope.

## Run it locally

This uses the mock provider, so nothing leaves your machine.

```bash
cd examples/cloudflare-worker-d1
bun install
cp .dev.vars.example .dev.vars
bun run db:migrate:local
bunx wrangler dev --test-scheduled
```

`--test-scheduled` lets you trigger the cron from a URL; `wrangler dev` does
not run Cron Triggers by itself. In a second terminal:

```bash
export API_TOKEN=dev-admin-token-for-local-testing-only
```

1. Register the sample receiver. `DEV_ALLOW_PRIVATE_WEBHOOK_URLS=true` in
   `.dev.vars` is what allows an `http://localhost` URL.

   ```bash
   curl -s -X POST http://localhost:8787/webhook-endpoints \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"url":"http://localhost:8787/webhooks/receiver"}'
   ```

   The response is the only one that contains the endpoint's `secret`:

   ```json
   {"id":"51257cb4-...","url":"http://localhost:8787/webhooks/receiver","events":["message.sent","message.delivered","message.failed"],"secret":"whsec_a574...","createdAt":"2026-09-26T13:27:14.640Z"}
   ```

2. Add the secret to `.dev.vars` as `WEBHOOK_RECEIVER_SECRET=whsec_...` and
   restart `wrangler dev`, which reads `.dev.vars` only at startup. Restart
   before you send anything: the mock provider keeps its delivery results in
   memory, so a restart forgets messages sent earlier and they stay `SENT`.

3. Send a message:

   ```bash
   curl -s -X POST http://localhost:8787/messages \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"to":"010-1234-5678","text":"Your code is 123456"}'
   ```

   ```json
   {"messageId":"00445612-e3e6-41b0-aa0e-a6f9b1e5282b","type":"SMS","status":"SENT"}
   ```

   Right after the response, the Worker sends a signed `message.sent` webhook
   to the receiver, and the `wrangler dev` output shows:

   ```text
   {"level":"info","message":"webhook received","eventId":"00445612-...:SENT","type":"message.sent","messageId":"00445612-...","status":"SENT"}
   ```

4. Read its tracked status. It is `SENT` until the tracker polls it:

   ```bash
   curl -s http://localhost:8787/messages/00445612-e3e6-41b0-aa0e-a6f9b1e5282b \
     -H "Authorization: Bearer $API_TOKEN"
   ```

5. Wait 30 seconds, when the first status check falls due, then run the
   cron:

   ```bash
   curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
   ```

   The mock provider reports the message as delivered, the tracker stores
   `DELIVERED` and sends a signed `message.delivered` webhook to the receiver,
   and the `wrangler dev` output shows:

   ```text
   {"level":"info","message":"webhook received","eventId":"00445612-...:DELIVERED","type":"message.delivered","messageId":"00445612-...","status":"DELIVERED"}
   ```

   Reading the message again (step 4) now shows `"status":"DELIVERED"`.

6. Try the receiver's checks. An unsigned request is refused:

   ```bash
   curl -s -X POST http://localhost:8787/webhooks/receiver -d '{}'
   # {"error":{"code":"MISSING_SIGNATURE","message":"X-Webhook-Signature and X-Webhook-Timestamp are required"}}
   ```

   Sign a request the way the Worker does:

   ```bash
   SECRET=whsec_...   # WEBHOOK_RECEIVER_SECRET
   BODY='{"id":"manual-test:1","type":"message.delivered","timestamp":"2026-09-26T00:00:00.000Z","version":"1.0","data":{},"metadata":{}}'
   TS=$(date +%s)
   SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')
   curl -s -i -X POST http://localhost:8787/webhooks/receiver \
     -H "X-Webhook-Timestamp: $TS" -H "X-Webhook-Signature: sha256=$SIG" \
     --data-binary "$BODY"
   ```

   The first request answers `204` and logs `webhook received`. Sending it
   again answers `204` and logs `duplicate webhook skipped`. Changing `BODY`
   without signing it again answers `401 INVALID_SIGNATURE`, and signing with
   a timestamp more than five minutes old answers `401 STALE_WEBHOOK`.

## Use a real provider

Set `KMSG_PROVIDER`, `KMSG_SENDER_NUMBER` and the provider's secrets. Locally,
`.dev.vars` overrides the `vars` in `wrangler.jsonc`; in production, put
`KMSG_PROVIDER` and `KMSG_SENDER_NUMBER` in `vars` and the keys in secrets (see
[Deploy](#deploy)). While a required value is missing or invalid, every
request answers `500 CONFIGURATION_ERROR` and the log names the value.

`KMSG_SENDER_NUMBER` must be a sender number registered with the provider, such as
`0212345678` or `1588-1234`; carriers reject messages from unregistered
numbers.

| `KMSG_PROVIDER` | Secrets | Notes |
| --- | --- | --- |
| `mock` | none | Default. Keeps messages in memory and reports them as `DELIVERED`. Local development only. |
| `iwinv` | `IWINV_API_KEY`, `IWINV_SMS_API_KEY`, `IWINV_SMS_AUTH_KEY`, `IWINV_SMS_COMPANY_ID` | `IWINVProvider` needs the AlimTalk key even for SMS, and SMS status lookups need the company id. |
| `solapi` | `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` | The `solapi` SDK needs `nodejs_compat`, which `wrangler.jsonc` enables. It takes no abort signal, so the 10-second send timeout does not apply. |
| `aligo` | `ALIGO_API_KEY`, `ALIGO_USER_ID` | `ALIGO_TEST_MODE=true` makes Aligo accept messages without sending them. Aligo has no status lookup in k-msg: its messages stay `SENT` until the tracker gives up after 24 hours and marks them `UNKNOWN`. |

IWINV and Aligo only accept API calls from IP addresses registered in their
consoles, and a Worker does not send from a fixed address. Check the
provider's IP restriction settings before you rely on this deployment; a
rejected call answers `502`.

## Endpoints

Errors always have the shape `{"error":{"code":"...","message":"..."}}`.
Admin routes need `Authorization: Bearer <API_TOKEN>` and answer
`503 ADMIN_API_DISABLED` while `API_TOKEN` is not set. Request bodies are
limited to 64 KiB (`413 PAYLOAD_TOO_LARGE`).

### `POST /messages` (admin)

Body: `{"to":"01012345678","text":"..."}`. `to` is a Korean mobile number;
hyphens and spaces are removed. `text` is up to 2,000 bytes, counting
non-ASCII characters as 2. KMsg sends texts over 90 bytes as LMS. Any other
field, including `from`, is refused.

`202` with `{"messageId","type","status"}` and a `Location` header. The
provider gets 10 seconds to answer (SOLAPI ignores this limit). Failures keep
the provider's own error text in the logs and answer with the
`KMsgErrorCode`:

| Status | `code` |
| --- | --- |
| `429` | `RATE_LIMIT_EXCEEDED`, with `Retry-After` when the provider gives one |
| `503` | `NETWORK_ERROR`, `NETWORK_SERVICE_UNAVAILABLE`, `REQUEST_ABORTED`, or `NETWORK_TIMEOUT`, after which the message may still have been sent |
| `502` | Any other code, such as `AUTHENTICATION_FAILED`, `INSUFFICIENT_BALANCE` or `INVALID_REQUEST` |

### `GET /messages/:messageId` (admin)

`200` with the tracked status, `400 INVALID_INPUT` when the id is not a UUID,
`404 NOT_FOUND` for an unknown id:

```json
{
  "messageId": "00445612-e3e6-41b0-aa0e-a6f9b1e5282b",
  "providerId": "mock",
  "type": "SMS",
  "status": "DELIVERED",
  "providerStatusCode": null,
  "providerStatusMessage": null,
  "requestedAt": "2026-09-26T13:27:47.847Z",
  "statusUpdatedAt": "2026-09-26T13:28:19.785Z",
  "sentAt": "2026-09-26T13:27:47.847Z",
  "deliveredAt": "2026-09-26T13:27:47.847Z",
  "failedAt": null
}
```

`status` is `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `CANCELLED` or `UNKNOWN`.

### `POST /webhook-endpoints` (admin)

Body: `{"url":"https://example.com/hooks/kmsg","events":["message.delivered"]}`.
`events` is optional and defaults to `message.sent`, `message.delivered` and
`message.failed`. The URL must use HTTPS and a public host unless
`DEV_ALLOW_PRIVATE_WEBHOOK_URLS=true` (`400 INVALID_WEBHOOK_URL`). A URL that
is already registered answers `409 ENDPOINT_EXISTS`.

`201` with `{"id","url","events","secret","createdAt"}`. The secret is not
shown again.

### `POST /webhooks/receiver`

The sample receiver described below. It answers `404` unless
`WEBHOOK_RECEIVER_SECRET` is set, `401` with `MISSING_SIGNATURE`,
`INVALID_SIGNATURE` or `STALE_WEBHOOK` when a check fails, `400` when a
signed body is not an event, and `204` otherwise.

## Webhooks

Every endpoint subscribed to an event gets a webhook when a message reaches
that status: `SENT` becomes `message.sent`, `DELIVERED` `message.delivered`
and `FAILED` `message.failed`. `POST /messages` sends the first one, usually
`message.sent`, after the provider accepts the message; its `previousStatus`
is `null`. After that, each cron run polls the messages that are due, stores
the new statuses and sends one webhook per change. `@k-msg/webhook` has no
event for `CANCELLED` or `UNKNOWN`, so those changes are logged but not sent;
`GET /messages/:id` still shows them.

Status webhooks are delivered at least once. Two services polling the same
store, or two overlapping cron runs, can each report the same change, and
every delivery carries a fresh timestamp and signature. The event id is
always `<messageId>:<status>`, so receivers must skip ids they have already
processed; the sample receiver does this with the `sample_receiver_events`
table.

A delivery is a `POST` with a JSON body:

```json
{
  "id": "00445612-e3e6-41b0-aa0e-a6f9b1e5282b:DELIVERED",
  "type": "message.delivered",
  "timestamp": "2026-09-26T13:28:19.788Z",
  "version": "1.0",
  "data": { "...": "the GET /messages/:messageId fields", "previousStatus": "SENT" },
  "metadata": { "messageId": "00445612-e3e6-41b0-aa0e-a6f9b1e5282b", "providerId": "mock" }
}
```

and these headers:

| Header | Value |
| --- | --- |
| `X-Webhook-ID` | The event id (not covered by the signature) |
| `X-Webhook-Event` | The event type |
| `X-Webhook-Timestamp` | Unix time in seconds |
| `X-Webhook-Signature` | `sha256=` and the hex HMAC-SHA256 of `<timestamp>.<raw body>`, keyed with the endpoint's secret |

A receiver checks the signature over the raw body, rejects timestamps more
than five minutes from its clock, and then deduplicates by the `id` in the
body. With `@k-msg/webhook`:

```ts
import { SecurityManager } from "@k-msg/webhook";

const signatures = new SecurityManager({ algorithm: "sha256" });

export function isAuthentic(body: string, headers: Headers, secret: string) {
  const timestamp = headers.get("X-Webhook-Timestamp") ?? "";
  const signature = headers.get("X-Webhook-Signature") ?? "";
  return (
    signatures.verifySignatureWithTimestamp(body, timestamp, signature, secret) &&
    signatures.verifyTimestamp(timestamp, 300)
  );
}
```

Each attempt times out after 5 seconds. Timeouts, network errors and `408`,
`429` or `5xx` responses are retried up to twice within the same cron run;
any other response that is not `2xx`, redirects included, fails at once.
After that the event is not sent again: the row in `kmsg_webhook_deliveries`
keeps every attempt, and the Worker logs `webhook delivery failed`.

## Schema and migrations

| Migration | Tables | Source |
| --- | --- | --- |
| `0001_delivery_tracking.sql` | `kmsg_delivery_tracking` | `buildDeliveryTrackingSchemaSql({ dialect: "sqlite" })` from `@k-msg/messaging/adapters/cloudflare`, the same SQL as `k-msg db schema print --dialect sqlite --target tracking --format sql` |
| `0002_webhooks.sql` | `kmsg_webhook_endpoints`, `kmsg_webhook_deliveries` | `buildWebhookSchemaSql()` from `@k-msg/webhook/adapters/cloudflare` |
| `0003_sample_receiver.sql` | `sample_receiver_events` | This example's receiver, not k-msg |

The migrations are the source of truth: the tracking store and the webhook
persistence are both created with `initializeSchema: false`, so requests run
no DDL, and the tables must exist before the first deploy. When you upgrade
k-msg, print the schema again and add a migration for any difference:

```bash
bun -e 'import { buildDeliveryTrackingSchemaSql } from "@k-msg/messaging/adapters/cloudflare"; import { buildWebhookSchemaSql } from "@k-msg/webhook/adapters/cloudflare"; console.log(buildDeliveryTrackingSchemaSql({ dialect: "sqlite" })); console.log(buildWebhookSchemaSql().map((s) => `${s};`).join("\n\n"));'
```

## Deploy

```bash
bunx wrangler login
bunx wrangler d1 create kmsg
```

Replace `database_id` in `wrangler.jsonc` with the id this prints, then apply
the migrations to the remote database:

```bash
bunx wrangler d1 migrations apply DB --remote
```

Set the secrets. `wrangler secret put` offers to create the Worker if it does
not exist yet.

```bash
openssl rand -hex 32   # the admin token; keep it for your API clients
bunx wrangler secret put API_TOKEN
bunx wrangler secret put IWINV_API_KEY
bunx wrangler secret put IWINV_SMS_API_KEY
bunx wrangler secret put IWINV_SMS_AUTH_KEY
bunx wrangler secret put IWINV_SMS_COMPANY_ID
```

Those are IWINV's keys; the provider table lists the others. Set
`KMSG_PROVIDER` and `KMSG_SENDER_NUMBER` under `vars` in `wrangler.jsonc`, then
deploy:

```bash
bun run deploy
```

The Cron Trigger starts with the deployment. Register your receiver's HTTPS
URL with `POST /webhook-endpoints`. Leave `DEV_ALLOW_PRIVATE_WEBHOOK_URLS`
and `WEBHOOK_RECEIVER_SECRET` unset in production.

## Production checklist

- Apply new migrations with `--remote` before you deploy code that needs
  them.
- `API_TOKEN` is random and at least 32 characters. Consider Cloudflare
  Access or rate limiting rules in front of the admin routes as well.
- `POST /messages` is not idempotent. A client that retries after a timeout
  (`503 NETWORK_TIMEOUT`) can send the same text twice.
- Receivers use HTTPS, verify the signature and timestamp, and skip event ids
  they have already processed.
- A webhook is not retried after its cron run. If your systems must not miss
  a status, reconcile with `GET /messages/:id` or move delivery onto
  Cloudflare Queues.
- The tracker has no lease on due records, so a slow cron run can overlap the
  next one and report a change twice; event ids make the repeat detectable.
- Each cron run handles up to 200 due records. Status lookups, D1 queries and
  webhook attempts all count as subrequests, and the Workers Free plan allows
  50 per invocation and 10 ms of CPU, so plan for the Paid plan.
- Nothing is deleted automatically. `kmsg_delivery_tracking` keeps recipient
  numbers in plain text, `kmsg_webhook_deliveries` keeps payloads and receiver
  responses, and endpoint secrets are stored in plain text unless you
  configure `fieldCrypto` on `WebhookRuntimeService`. Schedule a cleanup that
  fits your retention policy.
- Workers Logs is enabled in `wrangler.jsonc`. Alert on the `error` and
  `warn` lines: `send failed`, `could not record a sent message`,
  `status webhook failed`, `webhook delivery failed` and
  `delivery status poll failed`.

