# @k-msg/messaging

> Canonical docs: [k-msg.and.guide](https://k-msg.and.guide)

High-level messaging facade for `k-msg`.

This package provides `KMsg`, which normalizes user input, routes to a provider, and returns a `Result`.

## Installation

```bash
npm install @k-msg/messaging @k-msg/core
# or
bun add @k-msg/messaging @k-msg/core
```

## Runtime Adapters

`@k-msg/messaging` root export is runtime-neutral.

- Bun runtime adapters: `@k-msg/messaging/adapters/bun`
  - `BunSqlDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, `SQLiteJobQueue`
- Node runtime adapters: `@k-msg/messaging/adapters/node`
  - `DeliveryTracker`, `JobProcessor`, `MessageJobProcessor`, `MessageRetryHandler`
- Cloudflare runtime adapters: `@k-msg/messaging/adapters/cloudflare`
  - SQL adapters for Hyperdrive/Postgres/MySQL and D1 (driver-injected)
  - Drizzle-wrapped SQL client/store factories
  - SQL/Drizzle schema generators
  - Object-storage adapters for KV/R2/DO-backed tracking/queue

## Migration (Breaking)

| Old import (removed from root) | New import |
| --- | --- |
| `BunSqlDeliveryTrackingStore` | `@k-msg/messaging/adapters/bun` |
| `SqliteDeliveryTrackingStore` | `@k-msg/messaging/adapters/bun` |
| `SQLiteJobQueue` | `@k-msg/messaging/adapters/bun` |
| `JobProcessor` / `MessageJobProcessor` | `@k-msg/messaging/adapters/node` |
| `MessageRetryHandler` | `@k-msg/messaging/adapters/node` |
| `createDeliveryTrackingHooks` / `DeliveryTrackingService` / `InMemoryDeliveryTrackingStore` | `@k-msg/messaging/tracking` |
| `BulkMessageSender` | `@k-msg/messaging/sender` |
| `Job` / `JobQueue` / `JobStatus` | `@k-msg/messaging/queue` |
| `VariableReplacer` / `VariableUtils` / `defaultVariableReplacer` | `@k-msg/template` (`TemplatePersonalizer` / `TemplateVariableUtils` / `defaultTemplatePersonalizer`) |

`JobProcessor` and `MessageJobProcessor` now require explicit `jobQueue` injection.

## Quick Start

```ts
import { KMsg } from "@k-msg/messaging";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
  defaults: {
    sms: { autoLmsBytes: 90 },
  },
});

// Default SMS (type omitted). If the content is long, it can auto-upgrade to LMS.
await kmsg.send({ to: "01012345678", text: "hello" });

// Explicit typed send
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## Routing

```ts
import { KMsg } from "@k-msg/messaging";
import { IWINVProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
    }),
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
      kakaoPfId: process.env.SOLAPI_KAKAO_PF_ID,
      rcsBrandId: process.env.SOLAPI_RCS_BRAND_ID,
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
      SMS: ["solapi"],
    },
    strategy: "first",
  },
});
```

## Bulk Sending

Use `sendMany()` for controlled concurrency.

```ts
const results = await kmsg.sendMany(
  [
    { to: "01011112222", text: "hello 1" },
    { to: "01033334444", text: "hello 2" },
  ],
  { concurrency: 10 },
);
```

## Delivery Tracking (PULL)

After a message is accepted by a provider (including scheduled sends), you can **poll provider status APIs** to
reconcile delivery state and update your internal records.

`DeliveryTrackingService` is storage-backed and supports:
- In-memory store (runtime-neutral default)
- SQLite/Bun.SQL via `@k-msg/messaging/adapters/bun`
- Cloudflare SQL/KV/R2/DO via `@k-msg/messaging/adapters/cloudflare`

```ts
import {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
  InMemoryDeliveryTrackingStore,
} from "@k-msg/messaging/tracking";
import { KMsg } from "@k-msg/messaging";
import { SolapiProvider } from "@k-msg/provider/solapi";

const providers = [
  new SolapiProvider({
    apiKey: process.env.SOLAPI_API_KEY!,
    apiSecret: process.env.SOLAPI_API_SECRET!,
  }),
];

const tracking = new DeliveryTrackingService({
  providers,
  store: new InMemoryDeliveryTrackingStore(),
});

const kmsg = new KMsg({
  providers,
  hooks: createDeliveryTrackingHooks(tracking),
});

// On successful send, providerMessageId is recorded into the tracking store.
await kmsg.send({ to: "01012345678", text: "hello" });

// Run as a cron/worker loop
tracking.start();
// or single pass (manual/cron)
await tracking.runOnce();
```

### Bun SQLite Example

```ts
import { DeliveryTrackingService } from "@k-msg/messaging/tracking";
import { SqliteDeliveryTrackingStore } from "@k-msg/messaging/adapters/bun";

const tracking = new DeliveryTrackingService({
  providers,
  store: new SqliteDeliveryTrackingStore({ dbPath: "./kmsg.sqlite" }),
});
```

### Cloudflare D1/KV/R2/DO Example

```ts
import { DeliveryTrackingService } from "@k-msg/messaging/tracking";
import {
  createD1DeliveryTrackingStore,
  createKvDeliveryTrackingStore,
} from "@k-msg/messaging/adapters/cloudflare";

// D1
const d1Store = createD1DeliveryTrackingStore(env.DB);

// KV (or use createR2DeliveryTrackingStore / createDurableObjectDeliveryTrackingStore)
const kvStore = createKvDeliveryTrackingStore(env.KMSG_KV);

const tracking = new DeliveryTrackingService({
  providers,
  store: d1Store, // swap to kvStore as needed
});
```

### SQL Schema (D1/Postgres/MySQL)

`createD1DeliveryTrackingStore()` and `HyperdriveDeliveryTrackingStore` share the same logical table/index schema.
`DeliveryTrackingService.init()` creates these automatically.

Tracking table: `kmsg_delivery_tracking`

- Primary key: `message_id`
- Main columns: `provider_id`, `provider_message_id`, `type`, `to`, `from`, `status`
- Time columns: `requested_at`, `status_updated_at`, `next_check_at`, `sent_at`, `delivered_at`, `failed_at`, `last_checked_at`, `scheduled_at`
- Meta columns: `attempt_count`, `provider_status_code`, `provider_status_message`, `last_error`, `raw`, `metadata`

Indexes:

- `idx_kmsg_delivery_due(status, next_check_at)`
- `idx_kmsg_delivery_provider_msg(provider_id, provider_message_id)`
- `idx_kmsg_delivery_requested_at(requested_at)`

Notes by dialect:

- D1 (SQLite): JSON fields are stored as `TEXT`
- Postgres: JSON fields are stored as `JSONB`
- MySQL: identifier type differs (`VARCHAR`), JSON fields currently stored as `TEXT`

Queue table (when using `HyperdriveJobQueue` / `createD1JobQueue`): `kmsg_jobs`

- Primary key: `id`
- Main columns: `type`, `data`, `status`, `priority`, `attempts`, `max_attempts`, `delay`
- Time columns: `created_at`, `process_at`, `completed_at`, `failed_at`
- Meta columns: `error`, `metadata`

Queue indexes:

- `idx_kmsg_jobs_dequeue(status, priority, process_at, created_at)`
- `idx_kmsg_jobs_id(id)`

### Schema Utility API (Cloudflare Adapter)

```ts
import {
  buildCloudflareSqlSchemaSql,
  buildDeliveryTrackingSchemaSql,
  buildJobQueueSchemaSql,
  initializeCloudflareSqlSchema,
  renderDrizzleSchemaSource,
} from "@k-msg/messaging/adapters/cloudflare";

// SQL DDL string
const ddl = buildCloudflareSqlSchemaSql({
  dialect: "postgres",
  target: "both",
});

// Idempotent runtime initializer (duplicate/exists errors are ignored only for that case)
await initializeCloudflareSqlSchema(client, { target: "both" });

// Drizzle schema source (TypeScript string)
const drizzleSource = renderDrizzleSchemaSource({
  dialect: "postgres",
  target: "both",
});
```

### Drizzle Adapter Factories

```ts
import {
  createDrizzleDeliveryTrackingStore,
  createDrizzleJobQueue,
} from "@k-msg/messaging/adapters/cloudflare";

const trackingStore = createDrizzleDeliveryTrackingStore({
  dialect: "postgres",
  db, // drizzle db with execute()/transaction()
});

const queue = createDrizzleJobQueue({
  dialect: "postgres",
  db,
});
```

### Supported Drizzle Versions

| `@k-msg/messaging` | Supported `drizzle-orm` |
| --- | --- |
| `0.19.x` | `^0.44.0 || ^0.45.0` |

Compatibility for this line is validated in CI against the `drizzle-compat` matrix:

<!-- drizzle-compat-matrix:start -->
- `drizzle-orm@0.44.7`
- `drizzle-orm@0.45.1`
<!-- drizzle-compat-matrix:end -->

## Tracking-based API failover

When provider-native ALIMTALK failover is unsupported or partial, you can enable tracking-based API failover.

- Triggers only for `ALIMTALK` with `failover.enabled === true`
- Triggers only when tracking status is `FAILED` and classified as non-Kakao-user failure
- Attempts fallback exactly once per original message
- Requires providers with `getDeliveryStatus()` support

```ts
import {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
} from "@k-msg/messaging/tracking";
import { KMsg } from "@k-msg/messaging";
import { SolapiProvider } from "@k-msg/provider/solapi";

const providers = [
  new SolapiProvider({
    apiKey: process.env.SOLAPI_API_KEY!,
    apiSecret: process.env.SOLAPI_API_SECRET!,
    defaultFrom: "01000000000",
  }),
];

let kmsg!: KMsg;
const tracking = new DeliveryTrackingService({
  providers,
  apiFailover: {
    // Re-send fallback SMS/LMS through the same KMsg pipeline
    sender: (input) => kmsg.send(input),
  },
});

kmsg = new KMsg({
  providers,
  hooks: createDeliveryTrackingHooks(tracking),
});

await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",
  variables: { code: "123456" },
  failover: {
    enabled: true,
    fallbackChannel: "sms",
    fallbackContent: "[안내] 카카오톡 미사용자로 SMS 대체 발송",
  },
});
```
