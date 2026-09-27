---
title: "@k-msg/messaging"
description: "Generated from `packages/messaging/README.md`"
---
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

`MessageRetryHandler` is an application-level retry orchestrator for provider gaps. You must supply an `execute(attempt, item)` callback that performs the real resend logic, and the handler will only manage retry timing, policy, and queue state.

```ts
import { MessageRetryHandler } from "@k-msg/messaging/adapters/node";

const retryHandler = new MessageRetryHandler({
  policy: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 5000,
    maxDelay: 300000,
    jitter: true,
    retryableStatuses: ["FAILED"],
    retryableErrorCodes: ["NETWORK_TIMEOUT"],
  },
  checkInterval: 1000,
  maxQueueSize: 1000,
  execute: async (attempt) => {
    return await resendMessage(attempt.messageId);
  },
});
```

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

### SMS or LMS

When `type` is omitted, `KMsg` sends text longer than `defaults.sms.autoLmsBytes` (90 bytes by default) as LMS, counting one byte for each ASCII character and two for any other, such as Hangul. `estimateSmsBytes()` counts the same way, for example to check input before sending it:

```ts
import { estimateSmsBytes } from "@k-msg/messaging";

if (estimateSmsBytes(text) > 2_000) {
  // Longer than an LMS usually allows.
}
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

To try routing without provider credentials, give each `MockProvider` its own id:

```ts
import { KMsg } from "@k-msg/messaging";
import { MockProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [
    new MockProvider({ id: "kakao" }),
    new MockProvider({ id: "sms" }),
  ],
  routing: { byType: { ALIMTALK: "kakao", SMS: "sms", LMS: "sms" } },
});

const result = await kmsg.send({ to: "01012345678", text: "hello" });
// result.value.providerId === "sms"
```

`KMsgConfig`, `KMsgRoutingConfig`, `KMsgDefaultsConfig`, and `RoutingStrategy` are exported for typing configuration built outside the constructor.

## Bulk Sending

Pass an array to `send()`. Messages are grouped by provider and sent in chunks of up to 50, or the provider's batch limit if it is lower, and each message gets its own `Result`.

```ts
const batch = await kmsg.send([
  { to: "01011112222", text: "hello 1" },
  { to: "01033334444", text: "hello 2" },
]);

for (const result of batch.results) {
  if (result.isFailure) console.error(result.error.code, result.error.message);
}
```

## Timeouts and Cancellation

`send()` and `sendOrThrow()` take a second argument that is passed to the provider for that call: an `AbortSignal`, and optionally a `fetch` implementation. A batch shares them.

```ts
const result = await kmsg.send(
  { to: "01012345678", text: "hello" },
  { signal: AbortSignal.timeout(5_000) },
);
```

Providers declare what they honor in `provider.transportCapabilities` (`abortSignal`, `injectableFetch`); one that does not support an option ignores it.

## ALIMTALK Fallback Text

`failover.fallbackContent` and `failover.fallbackTitle` take the same `#{variable}` placeholders as SMS text, filled in from the message's `variables`. When `fallbackChannel` is omitted, `KMsg` sets it from the filled-in text: `lms` if it is longer than `defaults.sms.autoLmsBytes`, otherwise `sms`.

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "ORDER_SHIPPED",
  variables: { name: "Kim", orderId: "A-1024" },
  failover: {
    enabled: true,
    fallbackTitle: "Order shipped",
    // Sent as "Kim, order A-1024 has shipped." if the AlimTalk fails.
    fallbackContent: "#{name}, order #{orderId} has shipped.",
  },
});
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

`runOnce()` stores every update it can. If the store rejects one record's update (for example, a value its column cannot hold), the rest of the batch is still stored, the rejected record is checked again after its next backoff delay, and `runOnce()` then rejects with an `AggregateError` listing the failures.

To react when a status changes, for example to notify a webhook, pass `onStatusChange`. It receives a copy of each changed record as stored, one at a time and in order, after the poll finishes; if it throws, polling continues and the error goes to `onStatusChangeError` (or `console.error`). Delivery is best effort: a change whose callback throws is not retried, and one stored just before the process stops is not reported, so reconcile with the stored records when none may be missed. Services polling the same store can also each report a change, so make the callback idempotent, for example by message id and status. `await tracking.runOnce()` resolves once its changes have been delivered, so a cron or request handler that awaits it does not end before they run. A callback can call `runOnce()` itself; that call resolves once the poll's changes are queued, since they are delivered after the callback.

```ts
const tracking = new DeliveryTrackingService({
  providers,
  store: new InMemoryDeliveryTrackingStore(),
  onStatusChange: async ({ record, previousStatus }) => {
    // Your code, e.g. a POST to your webhook endpoint.
    await notifyStatus(record.messageId, previousStatus, record.status);
  },
});
```

`MockProvider` from `@k-msg/provider` reports each message it sent as `DELIVERED` (change it with `setDeliveryStatus`), so tracking can run without real credentials.

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

Each new store runs those `CREATE ... IF NOT EXISTS` statements before its first query, which in a Worker means every request. When migrations create the schema (for example from `buildDeliveryTrackingSchemaSql()`), pass `initializeSchema: false` to skip them. The SQLite and Bun.SQL stores take the same option; see [Creating the schema with migrations](#creating-the-schema-with-migrations).

The SQL job queues (`createD1JobQueue()`, `createDrizzleJobQueue()`, `HyperdriveJobQueue`) create their `kmsg_jobs` table and indexes the same way and take the same option. Migrations can create that schema from `buildJobQueueSchemaSql()`. `HyperdriveJobQueue` takes a table name or `{ tableName, initializeSchema }` as its second argument.

```ts
const store = createD1DeliveryTrackingStore(env.DB, {
  initializeSchema: false,
});
const queue = createD1JobQueue(env.DB, { initializeSchema: false });
```

Tracking table/index defaults are generated from the adapter schema spec:

<!-- tracking-schema-summary:start -->
- Tracking table default: `kmsg_delivery_tracking` (override with `tableName`)
- Primary key: `message_id`
- Core columns: `provider_id`, `provider_message_id`, `type`, `to`, `from`, `status`
- Time columns: `requested_at`, `status_updated_at`, `next_check_at`, `sent_at`, `delivered_at`, `failed_at`, `last_checked_at`, `scheduled_at`
- Meta columns: `attempt_count`, `provider_status_code`, `provider_status_message`, `last_error`, `metadata`
- `raw` column is disabled by default (`storeRaw: false`) and enabled only when `storeRaw: true` is set.
- Index: `idx_kmsg_delivery_due(status, next_check_at)`
- Index: `idx_kmsg_delivery_provider_msg(provider_id, provider_message_id)`
- Index: `idx_kmsg_delivery_requested_at(requested_at)`
<!-- tracking-schema-summary:end -->

Notes by dialect:

- D1 (SQLite): JSON fields are stored as `TEXT`
- Postgres: JSON fields are stored as `JSONB` documents, so SQL can read them (`last_error->>'code'`); `typeStrategy: { json: "text" }` stores them as `TEXT` instead. `JSONB` cannot hold NUL characters or unpaired surrogates, so those are stored as U+FFFD
- MySQL: the SQL schema builders make JSON fields `JSON`, while `renderDrizzleSchemaSource()` makes them `text`; the store reads either. MySQL cannot index `TEXT` columns, so set `typeStrategy: { messageId: "varchar", id: "varchar" }`
- `provider_status_message` is `TEXT` on every dialect. The other short text columns follow `typeStrategy.shortText` (`VARCHAR(64)` on Postgres and MySQL by default)

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

### Creating the schema with migrations

The `CREATE ... IF NOT EXISTS` statements a SQL tracking store runs on first use need the `CREATE` privilege even when the table exists, so a least-privilege role fails with `permission denied for schema public` or `must be owner of table`. In production, create the table with a migration and turn them off:

```ts
import {
  buildDeliveryTrackingSchemaSql,
  HyperdriveDeliveryTrackingStore,
} from "@k-msg/messaging/adapters/cloudflare";

// Commit the output as a migration. Build it from the options the store uses,
// so the two cannot drift apart.
const migration = buildDeliveryTrackingSchemaSql({ dialect: "postgres" });

const store = new HyperdriveDeliveryTrackingStore(client, {
  initializeSchema: false,
});
```

`createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `SqliteDeliveryTrackingStore` and `BunSqlDeliveryTrackingStore` take the same option. With it, the migration is the source of truth for the schema.

#### Upgrading tables created by earlier versions

- `provider_status_message` was `VARCHAR(64)` on Postgres and MySQL, so a longer provider message failed its status update. Widen it:

  ```sql
  -- Postgres
  ALTER TABLE kmsg_delivery_tracking ALTER COLUMN provider_status_message TYPE TEXT;
  -- MySQL
  ALTER TABLE kmsg_delivery_tracking MODIFY provider_status_message TEXT;
  ```

- On Postgres, rows written through postgres.js or Bun.SQL hold each `JSONB` value as a JSON string containing the JSON text, which SQL JSON operators cannot read.
  - `last_error`, `metadata`, `metadata_hashes` and the queue's `metadata` always hold objects, so the store and queue read those old strings as the objects they contain. To query old rows in SQL, convert them:

    ```sql
    UPDATE kmsg_delivery_tracking
    SET last_error = (last_error #>> '{}')::jsonb
    WHERE jsonb_typeof(last_error) = 'string';

    UPDATE kmsg_delivery_tracking
    SET metadata = (metadata #>> '{}')::jsonb
    WHERE jsonb_typeof(metadata) = 'string';
    ```

    With field encryption, convert `metadata_hashes` the same way.
  - `raw` and the queue's `data` may hold any JSON value, strings included, so they read back exactly as stored: an old row's value comes back as its JSON text. Convert those rows once, with the same `UPDATE` for `raw` and for `kmsg_jobs` `data` and `metadata`, after stopping the processes that run the earlier version (they cannot read converted rows) and before starting this one. Run it only on rows that postgres.js or Bun.SQL wrote, since every one of those is a JSON string. For the queue, you can instead let the old version finish its jobs first.

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

### Tracking Schema Customization

`storeRaw` defaults to `false`. Enable it only when you explicitly need provider raw payload storage.

```ts
import {
  buildDeliveryTrackingSchemaSql,
  getDeliveryTrackingSchemaSpec,
  HyperdriveDeliveryTrackingStore,
} from "@k-msg/messaging/adapters/cloudflare";

const trackingOptions = {
  tableName: "otp_delivery_tracking",
  columnMap: {
    messageId: "id",
    nextCheckAt: "next_check_at_ms",
  },
  typeStrategy: {
    messageId: "uuid",
    timestamp: "bigint",
  },
  storeRaw: true,
} as const;

// `client` is a Postgres CloudflareSqlClient, for example over Hyperdrive.
const store = new HyperdriveDeliveryTrackingStore(client, trackingOptions);
const ddl = buildDeliveryTrackingSchemaSql({
  dialect: "postgres",
  ...trackingOptions,
});
const spec = getDeliveryTrackingSchemaSpec(trackingOptions);
```

`typeStrategy.timestamp` sets the type of the time columns (`requested_at`, `next_check_at`, and the other `*_at` columns):

| `timestamp` | Postgres | MySQL | SQLite / D1 |
| --- | --- | --- | --- |
| `bigint` (default) | `BIGINT` | `BIGINT` | `INTEGER` |
| `integer` | `BIGINT` | `BIGINT` | `INTEGER` |
| `date` | `TIMESTAMPTZ` | `BIGINT` | `INTEGER` |

The stores write epoch milliseconds to numeric time columns and `Date`s to `TIMESTAMPTZ`. Epoch milliseconds (about 1.8 × 10¹² today) need 64 bits. SQLite's `INTEGER` has them, but `INTEGER` on Postgres and MySQL is 32-bit, so `integer` is an alias of `bigint`.

Earlier versions gave `integer` 32-bit `INTEGER` columns on Postgres and MySQL, which reject every insert as out of range. `CREATE TABLE IF NOT EXISTS` leaves an existing table as it is, so widen its time columns, using your `tableName` and `columnMap` names:

```sql
-- Postgres
ALTER TABLE kmsg_delivery_tracking
  ALTER COLUMN requested_at TYPE BIGINT,
  ALTER COLUMN status_updated_at TYPE BIGINT,
  ALTER COLUMN next_check_at TYPE BIGINT,
  ALTER COLUMN sent_at TYPE BIGINT,
  ALTER COLUMN delivered_at TYPE BIGINT,
  ALTER COLUMN failed_at TYPE BIGINT,
  ALTER COLUMN last_checked_at TYPE BIGINT,
  ALTER COLUMN scheduled_at TYPE BIGINT;

-- MySQL: MODIFY restates each column, so keep NOT NULL where it was
ALTER TABLE kmsg_delivery_tracking
  MODIFY requested_at BIGINT NOT NULL,
  MODIFY status_updated_at BIGINT NOT NULL,
  MODIFY next_check_at BIGINT NOT NULL,
  MODIFY sent_at BIGINT,
  MODIFY delivered_at BIGINT,
  MODIFY failed_at BIGINT,
  MODIFY last_checked_at BIGINT,
  MODIFY scheduled_at BIGINT;
```

MySQL without strict mode did not reject those inserts: it stored every time as 2147483647, which reads back as 1970-01-25, and widening the columns keeps that value. Polling marks each such row that is not yet final `UNKNOWN` (`TRACKING_TIMEOUT`) without asking the provider, because its `requested_at` reads as older than `maxTrackingDurationMs`. The real times are lost, so in the same migration delete those rows, or restore them from your own send records:

```sql
-- MySQL without strict mode: rows whose times were clamped
DELETE FROM kmsg_delivery_tracking WHERE requested_at = 2147483647;
```

If you keep a Drizzle schema rendered by `renderDrizzleSchemaSource()`, render it again: its time columns are now `bigint(..., { mode: "number" })` for `integer` too.

### Supported Drizzle Versions

| `@k-msg/messaging` | Supported `drizzle-orm` |
| --- | --- |
| `0.19.x` | `^0.44.0 || ^0.45.0 || >=1.0.0-beta <1.0.0` |

Compatibility for this line is validated in CI against the `drizzle-compat` matrix:

<!-- drizzle-compat-matrix:start -->
- `drizzle-orm@0.44.7`
- `drizzle-orm@0.45.2`
- `drizzle-orm@beta`
<!-- drizzle-compat-matrix:end -->

## Tracking-based API failover

When provider-native ALIMTALK failover is unsupported or partial, you can enable tracking-based API failover.

- Triggers only for `ALIMTALK` with `failover.enabled === true`
- Triggers only for sends whose provider returned a `FAILOVER_UNSUPPORTED_PROVIDER` or `FAILOVER_PARTIAL_PROVIDER` warning
- Triggers only when tracking status is `FAILED` and classified as non-Kakao-user failure
- Attempts fallback exactly once per original message
- Sends SMS or LMS as `fallbackChannel` says; a record without one (not sent through `KMsg`) goes as LMS when its text is over 90 bytes
- Requires providers with `getDeliveryStatus()` support

The service does not resend what a provider already sent itself: IWINV, and SOLAPI when the AlimTalk has a sender number (`from` or `defaultFrom`), return no such warning; Aligo returns one but has no `getDeliveryStatus()`, so its records never reach `FAILED`. The example below leaves SOLAPI without a sender and adds it to the fallback instead.

```ts
import {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
} from "@k-msg/messaging/tracking";
import { KMsg } from "@k-msg/messaging";
import { SolapiProvider } from "@k-msg/provider/solapi";

const providers = [
  // No defaultFrom: SOLAPI cannot replace the AlimTalk itself, so the
  // tracking service sends the fallback.
  new SolapiProvider({
    apiKey: process.env.SOLAPI_API_KEY!,
    apiSecret: process.env.SOLAPI_API_SECRET!,
    kakaoPfId: process.env.SOLAPI_KAKAO_PF_ID!,
  }),
];

let kmsg!: KMsg;
const tracking = new DeliveryTrackingService({
  providers,
  apiFailover: {
    // Re-send fallback SMS/LMS through the same KMsg pipeline
    sender: (input) => kmsg.send({ ...input, from: "01000000000" }),
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

