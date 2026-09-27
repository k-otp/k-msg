# @k-msg/analytics

> Canonical docs: [k-msg.and.guide](https://k-msg.and.guide)

Analytics and reporting for `k-msg`, built on top of delivery-tracking records.

## Installation

```bash
npm install @k-msg/analytics k-msg @k-msg/messaging @k-msg/provider
# or
bun add @k-msg/analytics k-msg @k-msg/messaging @k-msg/provider
```

## Features

- **Query-based (recommended)**: compute KPIs by reading `DeliveryTrackingStore` records (SQLite / Bun.SQL / memory)
- **Breakdowns**: by status, provider, message type
- **(Experimental)** in-memory collectors/insights/reporting utilities (subject to change)

## Basic Usage (Query-Based)

```typescript
import { KMsg } from "k-msg";
import {
  DeliveryTrackingService,
  createDeliveryTrackingHooks,
} from "@k-msg/messaging/tracking";
import { SqliteDeliveryTrackingStore } from "@k-msg/messaging/adapters/bun";
import { DeliveryTrackingAnalyticsService } from "@k-msg/analytics";

const providers = [
  /* new SolapiProvider(...), new IWINVProvider(...), ... */
];

// 1) Tracking (writes to store)
const store = new SqliteDeliveryTrackingStore({ dbPath: "./kmsg.sqlite" });
const tracking = new DeliveryTrackingService({ providers, store });
await tracking.init();

const kmsg = new KMsg({
  providers,
  hooks: createDeliveryTrackingHooks(tracking),
});

await kmsg.send({ to: "01012345678", text: "hello" });

// 2) Analytics (reads from the same store)
const analytics = new DeliveryTrackingAnalyticsService({ store });
const summary = await analytics.getSummary(
  { requestedAt: { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() } },
  { includeByProviderId: true, includeByType: true },
);

console.log(summary);
```

## Using Bun.SQL (Postgres/MySQL/SQLite)

```typescript
import { BunSqlDeliveryTrackingStore } from "@k-msg/messaging/adapters/bun";
import { DeliveryTrackingAnalyticsService } from "@k-msg/analytics";

const store = new BunSqlDeliveryTrackingStore({
  options: {
    adapter: "postgres",
    url: process.env.DATABASE_URL!,
  },
});

const analytics = new DeliveryTrackingAnalyticsService({ store });
await analytics.init();
```

## Webhook collector signatures (experimental)

`WebhookCollector` checks an HMAC-SHA256 signature on each webhook before
collecting it. The check is on by default (`enableSignatureValidation: true`):

- The constructor throws without a `secretKey`. To accept unsigned webhooks,
  pass `enableSignatureValidation: false`.
- The signature is read from the `signatureHeader` header (default
  `x-signature`, matched in any case), or from `webhook.signature` when that
  header is missing. It is `sha256=` followed by the hex HMAC-SHA256 of the raw
  body, keyed with `secretKey`. The prefix is optional, the hex can be in
  either case, and the digests are compared in constant time.
- The raw body is `webhook.rawBody`: the request body exactly as received, as
  a string, `Uint8Array`, or `ArrayBuffer`. A webhook without it is rejected,
  because `JSON.parse` followed by `JSON.stringify` rarely gives back the bytes
  the sender signed.
- The collector parses `body` from the verified raw body, which must be UTF-8
  JSON, so only signed data reaches the transformers. `body` can be left out;
  one passed alongside is replaced.
- `maxPayloadSize` (default 1 MB) applies to the raw body's size in bytes
  before the signature is checked.

```ts
import { WebhookCollector } from "@k-msg/analytics";

const collector = new WebhookCollector({
  secretKey: process.env.WEBHOOK_SECRET,
  signatureHeader: "x-hub-signature-256",
});

export async function receiveWebhook(request: Request) {
  // Pass the body as received: the collector verifies it, then parses it.
  const rawBody = await request.text();
  // Rejects with "Invalid webhook signature" when the signature does not match.
  return collector.receiveWebhook({
    id: crypto.randomUUID(),
    source: "sms-provider",
    timestamp: new Date(),
    headers: Object.fromEntries(request.headers),
    rawBody,
  });
}
```

The signature covers only the body, so it does not stop a captured request
from being sent again: deduplicate on an id in the body, such as the provider's
message id.

Deliveries from `@k-msg/webhook` sign `<X-Webhook-Timestamp>.<raw body>`
rather than the body alone, so this check rejects them. Verify those with
`@k-msg/webhook` and collect them with `enableSignatureValidation: false`.

## Notes

- `@k-msg/analytics` does not create its own database. It reads from the `kmsg_delivery_tracking` table written by `DeliveryTrackingService`.
- Tracking SQL schema now disables the `raw` column by default (`storeRaw: false`); enable it in the tracking store only when needed.
- For production usage, prefer a durable store (`SqliteDeliveryTrackingStore` or `BunSqlDeliveryTrackingStore`).
- Runtime diagnostics in analytics modules use `@k-msg/core` logger (no direct `console.*` in runtime paths).

## License

MIT
