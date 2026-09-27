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

### Polls with a Time Limit

`runOnce()` takes the same second argument as `send()` and passes it to each status query. Its `signal` also bounds the poll: once it aborts, no more queries start, those still running are cancelled, and `runOnce()` stores the statuses it has and returns. Records it did not finish stay due for the next poll.

```ts
// For example from a cron trigger that must finish within 30 seconds.
await tracking.runOnce({ signal: AbortSignal.timeout(25_000) });
```

### Several Pollers on One Store

When services share a store, as several instances or overlapping cron runs do, each poll leases the records it takes: until it stores their next check, other polls skip them, so a message is not queried, or sent a fallback, twice at once. A poll that stops early hands back the records it did not finish, except those another poll has leased since. The SQL stores and `InMemoryDeliveryTrackingStore` lease records; the KV, R2, and Durable Object stores do not, and a custom store can by implementing `leaseDue` and `releaseLeases`. On MySQL the lease is atomic only when the SQL client supports transactions. A lease a poll cannot hand back, for example because its process died, runs out after `polling.leaseMs` (5 minutes); `leaseMs: 0` turns leasing off.

### Shutting Down

`close()` stops the timer and stops a poll in progress as if its signal had aborted, waits for that poll to store the statuses it has, and then closes the store. It does not wait for status changes still being delivered to `onStatusChange`, and it waits for a fallback send in progress unless the sender passes on the signal it is given (see below). When a poll that `start()` runs fails, the error is logged through the `@k-msg/core` logger and the next tick polls again.

```ts
process.once("SIGTERM", () => {
  void tracking.close();
});
```

### Recording Errors

The hooks from `createDeliveryTrackingHooks` record each message a provider accepts. When recording fails, the send still succeeds but the message will not be polled; the error goes to `onRecordError`, or without it to `KMsg`'s `onHookError` (`console.error` if that is not set either). `onError` receives only failed sends, with their hook context.

```ts
const kmsg = new KMsg({
  providers,
  hooks: createDeliveryTrackingHooks(tracking, {
    onRecordError: (error, { context }) => {
      console.error(`Message ${context.messageId} will not be tracked`, error);
    },
  }),
});
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
- MySQL: JSON fields are stored as `JSON` (`TEXT` with `typeStrategy: { json: "text" }`). MySQL cannot index `TEXT` columns, so the primary key and the indexed columns are `VARCHAR` whatever `typeStrategy` says:
  - `message_id`, `provider_id`, `provider_message_id`, and with field encryption `to_hash` and `from_hash`: `VARCHAR(255)` (`message_id` is `VARCHAR(36)` with `messageId: "uuid"`)
  - `status`, and with field encryption `retention_class`: `VARCHAR(64)`
- `provider_status_message` and `metadata_enc` (encrypted metadata) are `TEXT` on every dialect. The other short text columns follow `typeStrategy.shortText` (`VARCHAR(64)` on Postgres and MySQL by default), except the indexed ones on MySQL

Queue table (when using `HyperdriveJobQueue` / `createD1JobQueue`): `kmsg_jobs`

- Primary key: `id`
- Main columns: `type`, `data`, `status`, `priority`, `attempts`, `max_attempts`, `delay`
- Time columns: `created_at`, `process_at`, `completed_at`, `failed_at`
- Meta columns: `error`, `metadata`
- While a job is processing under a lease (`leaseMs`), `process_at` holds when the lease ends (see SQL Job Queues below).

Queue indexes:

- `idx_kmsg_jobs_dequeue(status, priority, process_at, created_at)`
- `idx_kmsg_jobs_id(id)`

SQLite and D1 need index names to be unique per database, and Postgres per schema. A second queue table in the same one needs its own names, or its `CREATE INDEX IF NOT EXISTS` statements find the first table's indexes and skip. Pass `indexNames` to the queue (and to `buildJobQueueSchemaSql()`), or `queueIndexNames` to `buildCloudflareSqlSchemaSql()`, `initializeCloudflareSqlSchema()`, and `renderDrizzleSchemaSource()`.

```ts
const otpQueue = createD1JobQueue(env.DB, {
  tableName: "otp_jobs",
  indexNames: { dequeue: "idx_otp_jobs_dequeue", id: "idx_otp_jobs_id" },
});
```

`delay` holds milliseconds, so it is `BIGINT` on Postgres and MySQL (`INTEGER` on SQLite, which is 64-bit). Earlier versions made it a 32-bit `INTEGER` there, so a job delayed by 2^31 ms (about 24.9 days) or more could not be enqueued: the insert failed as out of range. `CREATE TABLE IF NOT EXISTS` leaves an existing table as it is, so widen the column:

```sql
-- Postgres
ALTER TABLE kmsg_jobs ALTER COLUMN delay TYPE BIGINT;

-- MySQL: MODIFY restates the column, so keep NOT NULL and the default
ALTER TABLE kmsg_jobs MODIFY delay BIGINT NOT NULL DEFAULT 0;
```

MySQL without strict mode stored such delays as 2147483647 instead. Those jobs still run on time, since `process_at` is `BIGINT`; only the `delay` they report is wrong.

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

Given the same options, the Drizzle schema declares the same column types, keys and indexes as the SQL DDL.

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

- On MySQL, the SQL schema could not be created with the default `typeStrategy` (error 1170), so existing tables were made with `typeStrategy: { messageId: "varchar", id: "varchar" }` or from the Drizzle schema. Both keep working:
  - The SQL schema for that `typeStrategy` has not changed, apart from `metadata_enc` (below). You can keep passing it, or drop it: without it, new tables with field encryption get `TEXT` instead of `VARCHAR(255)` for the columns no index covers, and existing tables work either way.
  - The Drizzle schema of earlier versions declared `varchar(255)` for every id column and `text` for JSON columns. It now follows `typeStrategy`, so drizzle-kit generates a migration: JSON columns become `json`, and with field encryption the columns no index covers (`to_enc`, `to_masked`, `from_enc`, `from_masked`, `metadata_enc`, `crypto_kid`) become `text`. The stored values convert as they are. To keep the rest of the table as it is, pass `typeStrategy: { id: "varchar", json: "text" }` to `renderDrizzleSchemaSource()` and to the store.
- `metadata_enc` followed `typeStrategy.id`, so it was `VARCHAR(255)` with `id: "varchar"` on Postgres and MySQL, and in both kinds of MySQL table above. With metadata encryption (`fields.metadata: "encrypt"`), that rejects encrypted metadata longer than 255 characters (MySQL error 1406, Postgres `value too long`); metadata JSON of about 110 characters is enough. The column is now `TEXT` whatever `typeStrategy` says. Widen existing tables:

  ```sql
  -- Postgres
  ALTER TABLE kmsg_delivery_tracking ALTER COLUMN metadata_enc TYPE TEXT;
  -- MySQL
  ALTER TABLE kmsg_delivery_tracking MODIFY metadata_enc TEXT;
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

### KV, R2 and Durable Object Job Queues

`createDurableObjectJobQueue`, `createKvJobQueue` and `createR2JobQueue` store each job as JSON under `keyPrefix` (default `kmsg/jobs`).

- With `leaseMs`, `dequeue()` leases the job it returns for that long. Without it, a job whose worker stopped mid-job, for example in a deploy, stays `processing` forever. If a leased job is neither completed nor failed in time, the next `dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`, exported as `JOB_LEASE_EXPIRED`) and makes the job due again, or fails it when no attempts are left, then calls `onLeaseExpired(job)`. It calls it before it leases the job it returns, so a slow callback does not shorten that lease.
  - A job that is already `processing` without a lease, such as one taken by an earlier version, gets a lease when `dequeue()` first sees it.
  - Leases are not renewed and not fenced: set `leaseMs` above the longest time a job can take, because a worker that outlives its lease can still complete or fail the job while another worker has it.
  - `dequeue({ running })` leaves the jobs its caller is still running alone: it neither hands them out again nor counts their lease as lost. `JobProcessor` passes the jobs it is running, so a handler that outlives its lease is not run twice by the same processor.
- `nextDueAt()` returns when `dequeue()` next has work: a pending job's due time or a lease's end. Set an alarm for it instead of polling. A time in the past means `dequeue()` has work now, even if only to fail a job whose lease ran out, so call `dequeue()` rather than checking `size()`.
- `complete(jobId, result)` keeps `result` on the job, for example the provider's message id. A result that JSON cannot hold, or that is too large for the storage, is logged and dropped rather than failing the completion. `fail()` never reopens a completed job.
- `cleanupTerminal({ olderThan })` removes only jobs that finished before `olderThan`, so a finished job stays readable for a while.
- On Durable Objects, reads take the values from the storage listing, a page at a time, instead of one `get()` per job. `dequeue()` still reads every stored job, so clean up finished jobs regularly.

For example, a Durable Object that sends from its alarm:

```ts
import { DurableObject } from "cloudflare:workers";
import { createDurableObjectJobQueue } from "@k-msg/messaging/adapters/cloudflare";

export class SendQueue extends DurableObject<Env> {
  private readonly queue = createDurableObjectJobQueue<SendInput>(
    this.ctx.storage,
    // Sends time out after 10 seconds, so a minute is plenty.
    { leaseMs: 60_000 },
  );

  async alarm(): Promise<void> {
    for (let job = await this.queue.dequeue(); job; job = await this.queue.dequeue()) {
      const result = await kmsg.send(job.data, {
        signal: AbortSignal.timeout(10_000),
      });
      if (result.isSuccess) {
        await this.queue.complete(job.id, {
          providerMessageId: result.value.providerMessageId,
        });
      } else {
        await this.queue.fail(job.id, result.error.code, {
          enabled: ErrorUtils.isRetryable(result.error),
          delayMs: 5_000,
        });
      }
    }

    // Keep finished jobs readable for a day.
    await this.queue.cleanupTerminal({
      olderThan: new Date(Date.now() - 24 * 60 * 60_000),
    });
    const next = await this.queue.nextDueAt();
    if (next) await this.ctx.storage.setAlarm(next);
  }
}
```

### SQL Job Queues

`HyperdriveJobQueue` (which `createD1JobQueue()` and `createDrizzleJobQueue()` return) and `SQLiteJobQueue` (`@k-msg/messaging/adapters/bun`) take the same `leaseMs` and `onLeaseExpired` options as the queues above, and have `nextDueAt()` and `cleanupTerminal({ olderThan })`. Leases are off unless `leaseMs` is set.

- The lease needs no new column. While a job is processing under a lease, its `process_at` (and `processAt`) holds when the lease ends, as does `leaseExpiresAt`.
- `dequeue()` settles expired leases and takes the next job so that no other `dequeue()` gets the same job or settles the same lease. As above, it leaves the jobs in `running` alone and calls `onLeaseExpired` before it leases the job it returns.
  - Postgres: one statement, which skips rows another worker has locked (`FOR UPDATE SKIP LOCKED`). With `onLeaseExpired`, one statement settles the leases and another takes the job once the callbacks have run.
  - SQLite and D1: two statements, each atomic under SQLite's write lock.
  - MySQL: a transaction that locks the rows it changes, at any isolation level, so give the client `transaction()`. Without it, a lease two workers settle at once can be reported to both, and without leases a job can go to two workers.
- A job already `processing` when you set `leaseMs`, taken by an earlier version or by a queue without `leaseMs`, looks like one whose lease has expired: the next `dequeue()` makes it due again at once. Turn leases on when no worker without them is in the middle of a job, and give every queue on a table the same setting.
- `fail()` never reopens a completed job, and counts the attempt in SQL, so an attempt that a lease expiry counted meanwhile is kept.
- `complete(jobId, result)` does not keep `result`: the table has no column for it.

For example, a Worker that sends from a Cron Trigger:

```ts
import { createD1JobQueue } from "@k-msg/messaging/adapters/cloudflare";

export default {
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const queue = createD1JobQueue<SendInput>(env.DB, {
      initializeSchema: false,
      // Sends time out after 10 seconds, so a minute is plenty.
      leaseMs: 60_000,
      onLeaseExpired: (job) => console.warn("lease expired", job.id, job.status),
    });

    for (let job = await queue.dequeue(); job; job = await queue.dequeue()) {
      const result = await kmsg.send(job.data, {
        signal: AbortSignal.timeout(10_000),
      });
      if (result.isSuccess) {
        await queue.complete(job.id);
      } else {
        await queue.fail(job.id, result.error.code, {
          enabled: ErrorUtils.isRetryable(result.error),
          delayMs: 5_000,
        });
      }
    }

    // Keep finished jobs readable for a day.
    await queue.cleanupTerminal({
      olderThan: new Date(Date.now() - 24 * 60 * 60_000),
    });
  },
};
```

Every queue in this package now has `nextDueAt()` and `cleanupTerminal(options)`, which the `JobQueue` interface declares as optional for queues of your own. `Job` has `leaseExpiresAt`, and `@k-msg/messaging/queue` exports `JOB_LEASE_EXPIRED` and the `JobLeaseOptions` and `JobQueueCleanupOptions` types.

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
- A stopped poll (its signal aborted, or `close()`) starts no fallback send: the record stays as it was, and the next poll sends it
- The sender's second argument has a `signal` that aborts when the poll is stopped. Pass it to the send so that `close()` does not wait for it; a send cancelled that way is recorded as a failed attempt
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
    // Re-send fallback SMS/LMS through the same KMsg pipeline, with a time
    // limit so a stalled send cannot hold a poll.
    sender: (input) =>
      kmsg.send(
        { ...input, from: "01000000000" },
        { signal: AbortSignal.timeout(10_000) },
      ),
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
