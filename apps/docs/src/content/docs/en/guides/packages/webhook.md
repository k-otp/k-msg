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
  batchSize: 10,
  batchTimeoutMs: 5_000,
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
  maxRetries: 3,
  retryDelayMs: 1_000,
  timeoutMs: 30_000,
  enableSecurity: false,
  enabledEvents: [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED],
  batchSize: 10,
  batchTimeoutMs: 5_000,
};

function createRuntime(env: Env): WebhookRuntimeService {
  return new WebhookRuntimeService({
    delivery: config,
    persistence: createD1WebhookPersistence(env.DB),
    security: {
      allowPrivateHosts: true,
    },
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

## Migration notes (breaking)

| Old usage | New usage |
| --- | --- |
| `WebhookService` (root) | `WebhookRuntimeService` (root) |
| `registerEndpoint()` auto test call | `addEndpoint()` only; test with `probeEndpoint()` |
| Advanced classes from root | import from `@k-msg/webhook/toolkit` |
| Cloudflare persistence from custom wiring | use `@k-msg/webhook/adapters/cloudflare` |

## Toolkit subpath

```ts
import { LoadBalancer, QueueManager } from "@k-msg/webhook/toolkit";
```

## License

MIT

