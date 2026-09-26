---
title: "@k-msg/webhook"
description: "Generated from `packages/webhook/README.md`"
---
Runtime-first webhook package for message events.

This package now follows a DX-first flow:

1. Start in 5 minutes with in-memory persistence
2. Move to production by swapping persistence to D1
3. Extend to SQLite/Drizzle(Postgres) with the same store contract

## Install

```bash
npm install @k-msg/webhook
# or
bun add @k-msg/webhook
```

## Runtime API (root)

`@k-msg/webhook` root exports runtime-only APIs:

- `WebhookRuntimeService`
- `createInMemoryWebhookPersistence`
- `addEndpoints`, `probeEndpoint`
- `validateEndpointUrl`
- `verifyWebhookRequest`, for receivers

Advanced building blocks are now exposed from subpaths:

- `@k-msg/webhook/toolkit`
- `@k-msg/webhook/adapters/cloudflare`

## Quickstart (in-memory)

```ts
import {
  WebhookEventType,
  WebhookRuntimeService,
  createInMemoryWebhookPersistence,
  type WebhookConfig,
} from "@k-msg/webhook";

const config: WebhookConfig = {
  maxRetries: 3,
  retryDelayMs: 1_000,
  timeoutMs: 30_000,
  enableSecurity: false,
  enabledEvents: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_FAILED,
    WebhookEventType.SYSTEM_MAINTENANCE,
  ],
};

const runtime = new WebhookRuntimeService({
  delivery: config,
  persistence: createInMemoryWebhookPersistence(),
});

await runtime.addEndpoint({
  url: "https://example.com/webhooks/k-msg",
  active: true,
  events: [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED],
});

await runtime.emitSync({
  id: crypto.randomUUID(),
  type: WebhookEventType.MESSAGE_SENT,
  timestamp: new Date(),
  data: { messageId: "msg_123", status: "sent" },
  metadata: { providerId: "iwinv", messageId: "msg_123" },
  version: "1.0",
});

await runtime.shutdown();
```

## Sending events

- `emitSync(event)` sends the event to every matching endpoint and resolves
  with the deliveries once they finish.
- `emit(event)` queues the event. Up to `batchSize` queued events (default
  10) go out together when that many are queued, when you call `flush()` or
  `shutdown()`, or, with `autoStart` (the default), `batchTimeoutMs`
  (default 5000 ms) after the first event is queued. Most calls resolve as
  soon as the event is queued. The call that fills a batch sends it, retries
  included, before it resolves, unless another batch is still being sent:
  then it resolves at once, and the full batch goes out as soon as the other
  one finishes (if that one fails, the timer, the next call or `flush()`
  sends it). The timer runs only while events are queued: a runtime that
  never calls `emit()` starts none, and one with an empty queue holds none.

`batchSize` and `batchTimeoutMs` only affect `emit()`, so a config used with
`emitSync()` can leave them out. A `batchSize` of `Infinity` keeps every event
queued until `flush()` or the timer sends them as one batch.

### Cloudflare Workers and other serverless runtimes

Work that is neither awaited nor passed to `ctx.waitUntil()` can be cancelled
when a Worker invocation ends, and that includes the `emit()` timer. In a
Worker:

- create the runtime for each request or cron run from its bindings, with
  `autoStart: false` (see `createRuntime` in the D1 quickstart below);
- await `emitSync()`, or call `emit()` and then
  `ctx.waitUntil(runtime.flush())`;
- keep `timeoutMs` and the retries within what the invocation allows:
  `waitUntil()` work gets 30 seconds after an HTTP response.

```ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const runtime = createRuntime(env);
    await runtime.emit({
      id: crypto.randomUUID(),
      type: WebhookEventType.MESSAGE_SENT,
      timestamp: new Date(),
      data: await request.json(),
      metadata: {},
      version: "1.0",
    });
    // Send the queue before the invocation ends.
    ctx.waitUntil(runtime.flush());
    return new Response(null, { status: 202 });
  },
};
```

## Message events

The message events match the delivery statuses of `@k-msg/messaging`
delivery tracking. No package sends them by itself: map each status change,
for example from `DeliveryTrackingService`'s `onStatusChange`, to its event
and emit it. `PENDING`, the status before a provider accepts a message, has
none.

| Delivery status | Event |
| --- | --- |
| `SENT` | `message.sent` |
| `DELIVERED` | `message.delivered` |
| `FAILED` | `message.failed` |
| `CANCELLED` | `message.cancelled` |
| `UNKNOWN` | `message.unknown`: tracking ended without a final result, for example because the provider has no status lookup |

`message.clicked` and `message.read` are also available.

## D1 quickstart (same runtime API)

```ts
import {
  WebhookEventType,
  WebhookRuntimeService,
  type WebhookConfig,
} from "@k-msg/webhook";
import { createD1WebhookPersistence } from "@k-msg/webhook/adapters/cloudflare";

type Env = {
  DB: D1Database;
};

const config: WebhookConfig = {
  // Small enough to finish inside the invocation (see above).
  maxRetries: 2,
  retryDelayMs: 1_000,
  timeoutMs: 5_000,
  enableSecurity: false,
  enabledEvents: [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED],
};

function createRuntime(env: Env): WebhookRuntimeService {
  return new WebhookRuntimeService({
    delivery: config,
    persistence: createD1WebhookPersistence(env.DB),
    security: {
      allowPrivateHosts: true,
    },
    // No timers in a Worker; see "Cloudflare Workers and other serverless
    // runtimes".
    autoStart: false,
  });
}
```

`createD1WebhookPersistence()` initializes schema automatically by default.

## Schema helpers (Cloudflare)

```ts
import {
  buildWebhookSchemaSql,
  initializeWebhookSchema,
} from "@k-msg/webhook/adapters/cloudflare";

const statements = buildWebhookSchemaSql();
// run statements in your migration system, or:
await initializeWebhookSchema(env.DB);
```

## SQLite / Drizzle(Postgres) snippets

`WebhookRuntimeService` accepts custom stores via `endpointStore` + `deliveryStore`.
Implement the same interfaces to plug any backend:

```ts
import type {
  WebhookDeliveryStore,
  WebhookEndpointStore,
} from "@k-msg/webhook";

class SqliteEndpointStore implements WebhookEndpointStore {
  async add() {}
  async update() {}
  async remove() {}
  async get() {
    return null;
  }
  async list() {
    return [];
  }
}

class SqliteDeliveryStore implements WebhookDeliveryStore {
  async add() {}
  async list() {
    return [];
  }
}
```

Then wire it without changing runtime logic:

```ts
const runtime = new WebhookRuntimeService({
  delivery: config,
  endpointStore: new SqliteEndpointStore(),
  deliveryStore: new SqliteDeliveryStore(),
});
```

## Security defaults

- Private hosts are blocked by default
- `http://localhost` style URLs require explicit allowance (runtime security options)

## Signing and verifying deliveries

With `enableSecurity: true`, every delivery is signed with HMAC, using the
endpoint's `secret`, or the delivery config's `secretKey` for an endpoint
without one. A delivery is never sent unsigned while `enableSecurity` is on:

- `addEndpoint()` and `updateEndpoint()` throw for an active endpoint that
  would have no secret. An inactive one needs none, so an endpoint without a
  secret can be paused with `updateEndpoint(id, { active: false })` instead of
  deleted.
- An active endpoint stored without one, for example before security was
  turned on, gets a `failed` delivery and no request. Its only attempt has no
  `httpStatus`, and its `error` says why; `probeEndpoint()` reports the same
  `error`.

Endpoints without their own secret share `secretKey`, so anyone who holds it
can sign requests to all of them. Give each receiver its own `secret` when
they are different parties.

Each request carries these headers:

| Header | Value |
| --- | --- |
| `X-Webhook-ID` | The event id |
| `X-Webhook-Event` | The event type |
| `X-Webhook-Timestamp` | Unix time, in seconds, when this attempt was sent |
| `X-Webhook-Signature` | `sha256=` and the hex HMAC-SHA256 of `<X-Webhook-Timestamp>.<raw body>`; only with `enableSecurity` |

An endpoint's own `headers` are sent as well, but cannot replace these. Only
the raw body and `X-Webhook-Timestamp` are signed: `X-Webhook-ID` and
`X-Webhook-Event` are not, so deduplicate and route on the `id` and `type` in
the body.

The timestamp is the send time of each attempt, not the event's `timestamp`,
and every retry is signed again, so a receiver that rejects old timestamps
still accepts retries and events that waited in the queue. `signatureHeader`,
`signaturePrefix` and `algorithm` (`sha256` or `sha1`) in the delivery config
change the signature header, its prefix, and the hash. The prefix defaults to
`sha256=` with either algorithm, and an empty `signaturePrefix` keeps that
default.

Receivers verify a request with `verifyWebhookRequest`. It compares the
signature in constant time, then rejects a timestamp more than `toleranceMs`
(default five minutes) from the receiver's clock. Timestamps have one-second
resolution, so a request up to a second older than `toleranceMs` can still
pass:

```ts
import { verifyWebhookRequest } from "@k-msg/webhook";

export async function receiveWebhook(
  request: Request,
  secret: string,
): Promise<Response> {
  // Verify the raw body; JSON.parse and JSON.stringify can change the bytes.
  const body = await request.text();
  const verified = verifyWebhookRequest(request.headers, body, secret, {
    toleranceMs: 5 * 60 * 1000,
  });
  if (verified.isFailure) {
    // MISSING_SIGNATURE, MISSING_TIMESTAMP, INVALID_SIGNATURE,
    // INVALID_TIMESTAMP or STALE_TIMESTAMP
    return new Response(verified.error.code, { status: 401 });
  }

  const event = JSON.parse(body);
  // Deliveries are at least once: skip event ids you have already processed.
  console.log("webhook received", event.id);
  return new Response(null, { status: 204 });
}
```

It also accepts Node-style header records (`req.headers`) and `Uint8Array` or
`ArrayBuffer` bodies. If the sender changed `algorithm`, `signatureHeader`, or
`signaturePrefix`, pass the same values in the options.

## Migration notes (breaking)

| Old usage | New usage |
| --- | --- |
| `WebhookService` (root) | `WebhookRuntimeService` (root) |
| `registerEndpoint()` auto test call | `addEndpoint()` only; test with `probeEndpoint()` |
| Advanced classes from root | import from `@k-msg/webhook/toolkit` |
| Cloudflare persistence from custom wiring | use `@k-msg/webhook/adapters/cloudflare` |
| `fieldCrypto.endpoint` / `fieldCrypto.delivery` without `fields.secret` / `fields.payload`, or with `plain`/`mask` | set `fields.secret` (endpoint) and `fields.payload` (delivery) to `encrypt` or `encrypt+hash`; other values now fail at startup |
| ciphertext written with `fieldCrypto.tenantId` set | now also bound to the tenant; values written before are rejected unless `fieldCrypto.acceptLegacyAad` is set. Deploy with the flag set, run `runtime.migrateFieldCryptoToTenant()` once every instance runs the new version (an older one still writes tenant-less values; running it again picks them up), pausing endpoint changes from other instances while it runs, then remove the flag. A custom delivery store must implement `replace()` and page `list()` with the `before` cursor |
| `BatchDispatcher` / `BatchConfig` from `@k-msg/webhook/toolkit` | removed; it never sent a request. Use `runtime.emit()` / `flush()`, or `WebhookDispatcher.dispatch()` for a single delivery (see [Toolkit subpath](#toolkit-subpath)) |

## Toolkit subpath

```ts
import { LoadBalancer, QueueManager } from "@k-msg/webhook/toolkit";
```

`BatchDispatcher` is no longer exported. It never sent an HTTP request: each job got a simulated result (a random 200 or 500 and an invented latency), so it reported deliveries that never happened. For batched delivery, queue events on the runtime: `emit()` queues an event, and the runtime sends queued events through `WebhookDispatcher`, `batchSize` at a time, every `batchTimeoutMs` or as soon as a batch fills, and records each result:

```ts
await runtime.emit(event);
await runtime.flush(); // sends whatever is still queued; shutdown() does too
const deliveries = await runtime.listDeliveries({ endpointId });
```

For an endpoint you manage outside the runtime, `new WebhookDispatcher(config, httpClient).dispatch(event, endpoint)` sends one delivery and returns it with its status. It does not check the URL, so run `validateEndpointUrl()` on endpoint URLs first.

## License

MIT

