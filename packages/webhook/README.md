# @k-msg/webhook

Webhook delivery helpers for emitting real-time message events to HTTP endpoints.

This package provides:
- `WebhookService`: a convenience facade (in-memory endpoint registry + batching)
- `WebhookDispatcher`: HTTP delivery with retries/backoff
- `SecurityManager`: HMAC signature generation/verification
- Zod schemas: `WebhookEventSchema`, `WebhookEndpointSchema`, `WebhookDeliverySchema`

Note:
- The default `WebhookService` storage is in-memory. For persistence/advanced workflows, see the exported building blocks such as `EndpointManager` and `DeliveryStore`.
- This package is runtime-neutral (Edge/Web/Node). Node built-ins are not required by default.

## Install

```bash
npm install @k-msg/webhook
# or
bun add @k-msg/webhook
```

## Quickstart (WebhookService)

```ts
import { readRuntimeEnv } from "@k-msg/core";
import {
  WebhookEventType,
  WebhookService,
  type WebhookConfig,
} from "@k-msg/webhook";

const config: WebhookConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  // Optional: maxDelayMs, backoffMultiplier, jitter
  timeoutMs: 30_000,
  enableSecurity: true,
  // Optional: used when an endpoint does not provide its own secret
  secretKey: readRuntimeEnv("WEBHOOK_SECRET"),
  // Optional: algorithm, signatureHeader, signaturePrefix
  enabledEvents: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_DELIVERED,
    WebhookEventType.MESSAGE_FAILED,
  ],
  batchSize: 10,
  batchTimeoutMs: 5_000,
};

const service = new WebhookService(config);

const endpoint = await service.registerEndpoint({
  url: "https://example.com/webhooks/k-msg",
  active: true,
  events: [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED],
  // Optional: endpoint-specific secret (preferred over config.secretKey)
  secret: readRuntimeEnv("WEBHOOK_SECRET"),
  // Optional: per-endpoint retry overrides
  retryConfig: { maxRetries: 5, retryDelayMs: 1000, backoffMultiplier: 2 },
  // Optional: metadata-based filters
  filters: { providerId: ["iwinv", "solapi"] },
});

// Asynchronous emit (batched)
await service.emit({
  id: crypto.randomUUID(),
  type: WebhookEventType.MESSAGE_SENT,
  timestamp: new Date(),
  data: { messageId: "msg_123", status: "sent" },
  metadata: { providerId: "iwinv", messageId: "msg_123" },
  version: "1.0",
});

// Synchronous emit (returns delivery attempts)
const deliveries = await service.emitSync({
  id: crypto.randomUUID(),
  type: WebhookEventType.MESSAGE_FAILED,
  timestamp: new Date(),
  data: { messageId: "msg_456", status: "failed" },
  metadata: { providerId: "solapi", messageId: "msg_456" },
  version: "1.0",
});

// Inspect recent deliveries (in-memory)
const recent = await service.getDeliveries(endpoint.id);
console.log(deliveries.length, recent.length);

await service.shutdown();
```

### Endpoint Registration Behavior

`registerEndpoint()` validates the URL and sends a test webhook once (a `system.maintenance` event via `testEndpoint()`).

## Security (HMAC Signatures)

When security is enabled and a secret is available (`endpoint.secret` or `config.secretKey`), outgoing requests include:
- `X-Webhook-Timestamp`: unix epoch seconds (string)
- `X-Webhook-Signature`: HMAC signature (default: `sha256=<hex>`)

Signature input is:

```
${timestamp}.${rawBody}
```

To verify a webhook, you must use the exact raw request body string.

### Hono Example

```ts
import { Hono } from "hono";
import { readRuntimeEnv } from "@k-msg/core";
import { SecurityManager } from "@k-msg/webhook";

const app = new Hono();

const security = new SecurityManager({
  algorithm: "sha256",
  signatureHeader: "X-Webhook-Signature",
  signaturePrefix: "sha256=",
});

app.post("/webhooks/k-msg", async (c) => {
  const payload = await c.req.text();

  const signature = c.req.header("X-Webhook-Signature") ?? "";
  const timestamp = c.req.header("X-Webhook-Timestamp") ?? "";
  const secret = readRuntimeEnv("WEBHOOK_SECRET") ?? "";

  if (!security.verifyTimestamp(timestamp, 300)) {
    return c.json({ error: "Request too old" }, 401);
  }
  if (!security.verifySignatureWithTimestamp(payload, timestamp, signature, secret)) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const event = JSON.parse(payload);
  return c.json({ ok: true, type: event.type });
});
```

## Retries and Delivery Status

`WebhookDispatcher` retries failed deliveries with exponential backoff.

Delivery status:
- `success`: received a 2xx response
- `failed`: non-retryable failure (typically non-retryable 4xx)
- `exhausted`: retryable failure, but retries were used up

## Filtering

Endpoints can filter deliveries based on event metadata:

```ts
await service.registerEndpoint({
  url: "https://example.com/webhooks/k-msg",
  active: true,
  events: [WebhookEventType.MESSAGE_SENT],
  filters: {
    providerId: ["iwinv"],
    channelId: ["marketing"],
    templateId: ["welcome-template"],
  },
});
```

## File Storage Adapter (for `type: "file"`)

`EndpointManager`, `EventStore`, `DeliveryStore`, and `QueueManager` no longer import Node `fs/path` directly.
When using file persistence, provide `fileAdapter`.

```ts
import { DeliveryStore, type FileStorageAdapter } from "@k-msg/webhook";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const nodeFileAdapter: FileStorageAdapter = {
  appendFile: (filePath, data) => fs.appendFile(filePath, data, "utf8"),
  readFile: (filePath) => fs.readFile(filePath, "utf8"),
  writeFile: (filePath, data) => fs.writeFile(filePath, data, "utf8"),
  ensureDirForFile: (filePath) =>
    fs.mkdir(path.dirname(filePath), { recursive: true }),
};

const store = new DeliveryStore({
  type: "file",
  filePath: "./data/deliveries.log",
  fileAdapter: nodeFileAdapter,
});
```

## Zod Schemas

This package exports Zod schemas for validation:
- `WebhookEventSchema` (timestamp is coerced from string/number to `Date`)
- `WebhookEndpointSchema`
- `WebhookDeliverySchema`

## License

MIT
