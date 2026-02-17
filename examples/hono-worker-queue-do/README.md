# Hono Worker: Durable Object Queue

Hono + Cloudflare Workers template where queue state is managed in a Durable Object and send execution is processed asynchronously.

Provider used in this template: `IWINV`.

This template does not require `nodejs_compat`.

## What this example shows

- `POST /queue/send` enqueues send jobs into a DO-backed queue
- Queue processing runs in the DO via `alarm()` and can be manually triggered with `POST /queue/drain`
- `KMsg` send execution is isolated in the DO (single coordination point per queue name)

## Setup

```bash
cd examples/hono-worker-queue-do
bun install
cp .dev.vars.example .dev.vars
```

Fill `.dev.vars`:

```ini
IWINV_API_KEY=...
IWINV_SMS_API_KEY=...
IWINV_SMS_AUTH_KEY=...
IWINV_SMS_SENDER_NUMBER=01000000000
QUEUE_NAME=default
```

Generate worker types once after config changes:

```bash
bun run types
```

## Local dev (Wrangler)

```bash
bun run dev
```

Wrangler starts a local worker with local Durable Object storage.

## API examples

Enqueue:

```bash
curl -X POST http://127.0.0.1:8787/queue/send \
  -H "content-type: application/json" \
  -d '{
    "to":"01012345678",
    "text":"hello from durable object queue",
    "delayMs":0,
    "maxAttempts":3
  }'
```

Drain immediately (optional):

```bash
curl -X POST http://127.0.0.1:8787/queue/drain \
  -H "content-type: application/json" \
  -d '{"maxJobs":10}'
```

Check queue size:

```bash
curl http://127.0.0.1:8787/queue/size
```

Check specific job:

```bash
curl "http://127.0.0.1:8787/queue/jobs/<JOB_ID>"
```
