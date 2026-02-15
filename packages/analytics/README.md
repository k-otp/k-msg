# @k-msg/analytics

Analytics and reporting for `k-msg`, built on top of delivery-tracking records.

## Installation

```bash
npm install @k-msg/analytics @k-msg/core
# or
bun add @k-msg/analytics @k-msg/core
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
  SqliteDeliveryTrackingStore,
  createDeliveryTrackingHooks,
} from "k-msg";
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
import { BunSqlDeliveryTrackingStore } from "k-msg";
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

## Notes

- `@k-msg/analytics` does not create its own database. It reads from the `kmsg_delivery_tracking` table written by `DeliveryTrackingService`.
- For production usage, prefer a durable store (`SqliteDeliveryTrackingStore` or `BunSqlDeliveryTrackingStore`).

## License

MIT
