# Cloudflare Worker: send queue on a Durable Object

A Hono Worker that accepts SMS/LMS send requests and queues them in a
Durable Object. The object sends them from its alarm with k-msg, retries the
failures that can be retried, and cleans up after itself.

## What this shows

- `POST /messages` validates `{"to", "text"}` and queues a job with
  `createDurableObjectJobQueue` from `@k-msg/messaging/adapters/cloudflare`.
  An `Idempotency-Key` header is required: a retried request gets the job it
  already created instead of queueing the message twice.
- The Durable Object's alarm sends each job with `KMsg` and a 10-second
  timeout. Errors that `ErrorUtils.isRetryable` accepts are retried with
  exponential backoff capped at 5 minutes, never sooner than the provider's
  `retryAfterMs`; after `SEND_MAX_ATTEMPTS` attempts the job fails.
- A job interrupted mid-send, for example by a deploy, is detected and retried
  instead of staying stuck.
- `cleanupTerminal()` and a sweep of expired idempotency keys run every 10
  minutes, so storage does not grow without bound.
- Every endpoint requires a bearer token, compared in constant time. The
  sender number comes from configuration, never from the request.
- `KMSG_PROVIDER` selects the provider: `mock` (the default; it sends
  nothing), `iwinv`, `solapi` or `aligo`.

## Run it locally

You need [Bun](https://bun.sh) (or npm) and `openssl`.

```bash
cd examples/cloudflare-worker-queue-do
bun install
echo "API_TOKEN=$(openssl rand -hex 32)" > .dev.vars
bun run dev
```

`wrangler dev` serves the Worker on http://localhost:8787 with local Durable
Object storage. In a second terminal:

```bash
cd examples/cloudflare-worker-queue-do
export API_TOKEN=$(sed -n 's/^API_TOKEN=//p' .dev.vars)
export KEY=$(openssl rand -hex 16)

curl -i http://localhost:8787/messages \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{"to":"010-1234-5678","text":"Your verification code is 482913"}'
```

```http
HTTP/1.1 202 Accepted
Location: /messages/job_1790430000499_14869ec7
Content-Type: application/json

{"jobId":"job_1790430000499_14869ec7"}
```

The alarm fires right away and the mock provider accepts the message. The
`wrangler dev` terminal logs it, with the number masked:

```json
{"level":"info","message":"message sent","jobId":"job_1790430000499_14869ec7","attempt":1,"to":"010****5678","providerId":"mock","providerMessageId":"mock-1790430000508-g9t3isjax"}
```

Run the same `curl` again: the response has the same `jobId` and an
`Idempotent-Replayed: true` header, and nothing new is queued. Sending a
different body with the same key returns `422 IDEMPOTENCY_KEY_REUSED`.

Look up the job, using the `jobId` you got:

```bash
curl http://localhost:8787/messages/job_1790430000499_14869ec7 \
  -H "Authorization: Bearer $API_TOKEN"
```

```json
{"jobId":"job_1790430000499_14869ec7","status":"completed","failedAttempts":0,"maxAttempts":5,"createdAt":"2026-09-26T13:40:00.499Z","nextAttemptAt":null,"completedAt":"2026-09-26T13:40:00.509Z","failedAt":null,"lastError":null}
```

See the queue's counters, and run a pass without waiting for the alarm:

```bash
curl http://localhost:8787/queue/stats -H "Authorization: Bearer $API_TOKEN"
curl -X POST http://localhost:8787/queue/drain -H "Authorization: Bearer $API_TOKEN"
```

```json
{"dueJobs":0,"openJobs":0,"totals":{"enqueued":1,"replayed":1,"sent":1,"retried":0,"failed":0,"interrupted":0,"removedJobs":0,"expiredKeys":0},"nextAlarmAt":"2026-09-26T13:50:00.499Z","lastCleanupAt":null,"nextCleanupAt":"2026-09-26T13:50:00.499Z"}
{"processed":0,"sent":0,"retried":0,"failed":0}
```

## Use a real provider

Add the provider, its keys, and a sender number registered with that provider
to `.dev.vars`, then restart `bun run dev`. For example:

```ini
API_TOKEN=...
KMSG_PROVIDER=solapi
KMSG_SENDER_NUMBER=0212345678
SOLAPI_API_KEY=...
SOLAPI_API_SECRET=...
```

| `KMSG_PROVIDER` | Required secrets | Notes |
| --- | --- | --- |
| `mock` (default) | none | Sends nothing. |
| `iwinv` | `IWINV_API_KEY`, `IWINV_SMS_API_KEY`, `IWINV_SMS_AUTH_KEY` | `IWINVProvider` needs the AlimTalk key even for SMS. |
| `solapi` | `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` | |
| `aligo` | `ALIGO_API_KEY`, `ALIGO_USER_ID` | `ALIGO_TEST_MODE=true` validates requests without sending them. |

Every provider except `mock` also needs `KMSG_SENDER_NUMBER`, digits only
(hyphens are removed). Korean carriers only deliver from sender numbers
registered with the provider in advance; any other number is rejected. From
here on, messages are really sent, so test with your own phone number.

`.dev.vars.example` lists every variable. Non-secret settings
(`KMSG_PROVIDER`, `KMSG_SENDER_NUMBER`, `SEND_MAX_ATTEMPTS`) have defaults in
the `vars` of `wrangler.jsonc`; `.dev.vars` overrides them locally.

## Endpoints

Every endpoint needs `Authorization: Bearer <API_TOKEN>`. Errors look like
`{"error":{"code":"INVALID_INPUT","message":"..."}}`.

| Endpoint | What it does | Success response |
| --- | --- | --- |
| `POST /messages` | Queues a message. Needs an `Idempotency-Key` header. | `202 {"jobId":"..."}` with a `Location` header; a replay also has `Idempotent-Replayed: true`. |
| `GET /messages/:jobId` | Returns the job's status. | `200` with the job (below). |
| `GET /queue/stats` | Counters, due and open jobs, next alarm and cleanup times. | `200` |
| `POST /queue/drain` | Runs a pass now (up to 25 jobs) instead of waiting for the alarm. | `200 {"processed","sent","retried","failed"}` |

`POST /messages` takes `{"to": "01012345678", "text": "..."}` and nothing
else: `to` is a Korean mobile number (hyphens and spaces are allowed), `text`
is at most 2,000 bytes with non-ASCII characters counted as 2, and a text over
90 bytes is sent as LMS. A `from` field is rejected. The body may be at most
16 KiB. The `Idempotency-Key` is 1 to 255 visible ASCII characters, such as a
UUID; reuse it whenever you retry the same message.

A job has `status` `pending`, `processing`, `completed` or `failed`, plus
`failedAttempts`, `maxAttempts`, `nextAttemptAt` (while pending) and
`lastError`: the `KMsgErrorCode` of the last failed attempt, or
`INTERRUPTED`. It never includes the recipient or the text.

| Status | Code | When |
| --- | --- | --- |
| 400 | `INVALID_JSON` | The body is not JSON. |
| 400 | `INVALID_INPUT` | A field is missing, invalid or unexpected. |
| 400 | `IDEMPOTENCY_KEY_REQUIRED` | `POST /messages` has no `Idempotency-Key`. |
| 401 | `UNAUTHORIZED` | The bearer token is missing or wrong. |
| 404 | `NOT_FOUND` | Unknown route, or no such job (finished jobs are deleted by the cleanup). |
| 413 | `PAYLOAD_TOO_LARGE` | The body is over 16 KiB. |
| 422 | `IDEMPOTENCY_KEY_REUSED` | The key was already used for a different message. |
| 500 | `CONFIGURATION_ERROR` | A variable or secret is missing or invalid; the Worker logs name it. |
| 503 | `QUEUE_UNAVAILABLE` | The Durable Object is overloaded or restarting; retry with the same key. |
| 500 | `INTERNAL_ERROR` | Anything else. |

Provider errors never reach the client: sending happens in the background,
so they show up as the job's `lastError` and in the logs.

## How the queue sends

- The alarm handles up to 25 due jobs per pass, one at a time, and sets
  itself to run again at once when a pass is full.
- A job is marked in flight while it is being sent. If the object stops
  mid-send, the next pass counts that attempt as failed (`INTERRUPTED`) and
  retries the job.
- Retryable errors (by default `NETWORK_ERROR`, `NETWORK_TIMEOUT`,
  `NETWORK_SERVICE_UNAVAILABLE`, `RATE_LIMIT_EXCEEDED`, `PROVIDER_ERROR` and
  `UNKNOWN_ERROR`) wait 2, 4, 8 seconds and so on, capped at 5 minutes, with
  jitter; if the provider sent `retryAfterMs`, at least that long (up to one
  hour). Other errors, such as `INVALID_REQUEST`, `AUTHENTICATION_FAILED` or
  `INSUFFICIENT_BALANCE`, fail the job at once.
- A retry runs when it is due or up to 10 seconds later: the library queue
  cannot say when its next delayed job is due, so while jobs wait the object
  checks every 10 seconds.
- Every 10 minutes, starting 10 minutes after the first job, finished jobs are
  deleted with `cleanupTerminal()` and idempotency keys older than 24 hours are
  removed. A finished job can be looked up until the next cleanup.

The Durable Object logs `message sent`, `send failed; retry scheduled`,
`send failed; giving up`, `job was interrupted mid-send` and
`queue cleaned up` as JSON lines, with phone numbers masked.

## Deploy

```bash
bunx wrangler login
bunx wrangler secret put API_TOKEN          # paste the output of: openssl rand -hex 32
bunx wrangler secret put SOLAPI_API_KEY     # the secrets of your provider
bunx wrangler secret put SOLAPI_API_SECRET
```

Set `KMSG_PROVIDER` and `KMSG_SENDER_NUMBER` in the `vars` of
`wrangler.jsonc`, then deploy:

```bash
bun run deploy
```

The first deploy applies the `v1` migration, which creates the SQLite-backed
`SendQueue` Durable Object class.

## Production checklist

- Generate `API_TOKEN` with `openssl rand -hex 32`, keep it in a secret, and
  give it only to the services that send messages.
- Register `KMSG_SENDER_NUMBER` with your provider before going live.
- Delivery is at least once. A send that times out or is interrupted is
  retried even though the provider may already have accepted it, so a
  recipient can occasionally get a message twice. Lower `SEND_MAX_ATTEMPTS` if
  a duplicate is worse than a missed message.
- One Durable Object sends one message at a time, and the library queue reads
  every stored job each time it takes one. For more volume, spread messages
  over several named queues (`getByName`) and keep the cleanup frequent.
- Finished jobs are deleted by the next cleanup. Keep Workers Logs (enabled by
  `observability` in `wrangler.jsonc`), or add delivery tracking as in
  `cloudflare-worker-hyperdrive`, if you need a lasting record.
- The SOLAPI SDK ignores the abort signal, so the 10-second timeout does not
  bound SOLAPI calls.
- IWINV and Aligo can restrict their APIs to registered server IP addresses,
  and Workers do not send from fixed IPs. Check your account's IP settings.
- Alert on `send failed; giving up` and `job was interrupted mid-send`.
