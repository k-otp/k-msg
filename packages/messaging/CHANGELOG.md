# @k-msg/messaging

## 0.35.0 — 2026-10-05

### Minor changes

- [aa22d460](https://github.com/k-otp/k-msg/commit/aa22d460951d7e02efde503b1d582646e3884d80) `IWINVProvider` sends IWINV RCS template messages (`RCS_TPL`), with an SMS/LMS fallback and delivery-status lookup.
  
  - New `IWINVConfig` fields: `rcsApiKey` (IWINV's RCS send API key, sent as `AUTH: base64(key)`; it enables `RCS_TPL`), `rcsBrandId` (default brand) and `rcsSenderNumber` (falls back to `senderNumber`). `createDefaultIWINVProvider()` reads `IWINV_RCS_API_KEY`, `IWINV_RCS_BRAND_ID` and `IWINV_RCS_SENDER_NUMBER`. An RCS-only config needs no AlimTalk or SMS keys. The CLI config accepts the same fields, and `k-msg providers doctor` lists the manual RCS checks `rcs_brand_template_approved` and `rcs_send_ip_registered`.
  - `RCS_TPL` posts to `https://rcs.bizservice.iwinv.kr/api/v1/send/`. `templateId` (or `rcs.templateId`) is the template code, `rcs.brandId` (or `rcsBrandId`) the brand, and `variables` (with `rcs.variables`) are sent by name as `templateParam`. `options.scheduledAt` reserves the send. IWINV offers RCS templates only, so the other `RCS_*` types stay unsupported on IWINV.
  - `@k-msg/core`: `RcsTemplateSendOptions` gains `failover` (`RcsFailoverOptions`, the same shape as `AlimTalkFailoverOptions`). IWINV maps it to `reSend`/`resendType`/`resendTitle`/`resendContent`. The fallback type follows `fallbackChannel` or the text's size. Text over 90 bytes as SMS or 2,000 bytes as LMS fails with `INVALID_REQUEST` before sending, and `rcs.disableSms: true` (which wins over `failover.enabled: true`) or `failover.enabled: false` sends no fallback. SOLAPI does not map it and returns a `FAILOVER_UNSUPPORTED_PROVIDER` warning.
  - `@k-msg/messaging`: `KMsg` fills `#{name}` placeholders in RCS template fallback text and sizes it for SMS or LMS, as it already did for AlimTalk.
  - IWINV's RCS send answer carries no message key, so `providerMessageId` is a correlation id, `iwinv-rcs:<brandId>:<templateCode>`. `getDeliveryStatus` looks the send up in IWINV's RCS history (`/api/v1/history/`) by brand, template, recipient and request time. It searches from a minute before the send to five minutes after it, reading every page. Two sends of one template to one number within moments of each other cannot be told apart. An IWINV `msgkey` passed as `providerMessageId` is looked up as is.
  - History rows map to statuses as follows: `state` 수신완료 → `DELIVERED`, 수신실패 → `FAILED`, 대기 → `PENDING`. Otherwise `done_code` `10000` → `DELIVERED`, and any other code → `FAILED`. Only a row without a code is read by its message.
  - RCS send codes are normalized like the other channels: HTTP 429/5xx first, then `202`/`204`/`205`/`206` → `AUTHENTICATION_FAILED`, `207` → `TEMPLATE_NOT_FOUND`, `203`/`208`–`221` → `INVALID_REQUEST`, `222`/`224`/`225` → `INSUFFICIENT_BALANCE`, and `223` or unlisted codes → `PROVIDER_ERROR`. A code-less 2xx answer, or a 200 with `success: 0`, is also `PROVIDER_ERROR`.
  - `details.reason` now also covers RCS: `IP_NOT_ALLOWED` (`206`), `SENDER_NUMBER_NOT_REGISTERED` (`217`/`218`), `RECIPIENT_NUMBER_INVALID` (`214`/`215`/`221`) and `AUTO_CHARGE_LIMIT_EXCEEDED` (`222`). — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.35.0, template@0.35.0

## 0.34.2 — 2026-10-03

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.34.2, template@0.34.2

## 0.34.1 — 2026-10-03

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.34.1, template@0.34.1

## 0.34.0 — 2026-10-02

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.34.0, template@0.34.0

## 0.33.0 — 2026-09-28

### Patch changes

- [0a256dcd](https://github.com/k-otp/k-msg/commit/0a256dcdbd9e8f8934a7c26cca8ab949c9b05614) Share field-crypto key selection between the tracking and webhook stores.
  
  - `@k-msg/core` exports `resolveFieldEncryptKid`, `resolveFieldDecryptKids`, `normalizeKidList`, and `extractEnvelopeKid`, which the messaging tracking stores already used as private helpers.
  - When a `keyResolver` has `resolveDecryptKeys`, `@k-msg/webhook` now decrypts with the envelope's own `kid` first, then the `kid`s from `resolveDecryptKeys`, as the tracking stores do. Before, a webhook secret or delivery field stopped decrypting once `resolveDecryptKeys` no longer listed its `kid`, even while the provider still held that key. Resolver `kid`s are also trimmed and blank ones dropped.
  - Both stores now put the envelope's `kid` first even when the resolver also lists it later, keep that `kid` exactly as written, and read it only from a v1 envelope, so a custom provider's own JSON ciphertext is no longer mistaken for one.
  - Without `resolveDecryptKeys`, neither store passes decrypt candidates: the provider picks the key from its own ciphertext, which the built-in AES-GCM provider already did from the envelope `kid`. — Thanks @imjlk!
- Updated dependencies: core@0.33.0, template@0.33.0

## 0.32.0 — 2026-09-27

### Minor changes

- [27075f88](https://github.com/k-otp/k-msg/commit/27075f888aa021fb0acf7894900eb8ab38c4da4c) The KV, R2 and Durable Object job queues (`CloudflareObjectJobQueue`) can lease the jobs they hand out, with the new `leaseMs` option. Without a lease, `dequeue()` marks a job `processing` for good, so a job whose worker stopped mid-job (a deploy, an evicted Durable Object) is never tried again. A leased job carries `leaseExpiresAt`. If it is neither completed nor failed in time, the next `dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`, exported as `JOB_LEASE_EXPIRED`) and makes the job due again, or fails it when no attempts are left, then reports it through `onLeaseExpired(job)` before it leases the job it returns. Leases are off by default, so existing queues behave as before. With leases on, a job already `processing` without a lease gets one when `dequeue()` first sees it, and is retried if it is still unfinished when that lease ends. Leases are not renewed and not fenced, so `leaseMs` must exceed the longest job.
  
  The queue also:
  - tells when it next has work: `nextDueAt()` is the earliest pending due time or lease end, so a Durable Object alarm no longer has to poll;
  - keeps what `complete(jobId, result)` is given as `result`, such as a provider message id, unless JSON cannot hold it or the storage rejects it, in which case the job completes without it;
  - no longer lets `fail()` reopen a completed job;
  - takes `cleanupTerminal({ olderThan, statuses })` to keep recently finished jobs, still accepting a statuses array.
  
  `size()` and `peek()` also count a job whose lease has expired. The constructor takes these options or a key prefix, and `createKvJobQueue`, `createR2JobQueue` and `createDurableObjectJobQueue` take them too. `JobQueue.dequeue()` takes an optional `running` set (`JobDequeueOptions`): the ids of jobs the caller is still running, which a queue that leases jobs neither hands out again nor counts as lost. `JobProcessor` passes the jobs it is running, so a handler that outlives its lease is neither run twice nor charged attempts it never made, and it still skips a job that a queue without the option hands back. It also keeps a failed job listed as running until the failure is stored. — Thanks @imjlk!
- [915d0d7b](https://github.com/k-otp/k-msg/commit/915d0d7b4620d97d23c4c0913ed7bb6755d0ab72) `createDeliveryTrackingHooks` reports a sent message that could not be recorded for tracking to the new `onRecordError(error, { context, result })` option. Its `onError` option used to receive those failures and failed sends alike, with no context, and without `onError` the recording failures were dropped. `onError` now receives only failed sends, as `onError(error, context)`. Without `onRecordError`, a recording failure is thrown from the hook, and `KMsg` reports it to `onHookError`, or `console.error`, without changing the send result. Move handling of recording failures from `onError` to `onRecordError`. — Thanks @imjlk!
- [4d8227f0](https://github.com/k-otp/k-msg/commit/4d8227f0e65e3f3b617dfdbd7b78389e4e27e31f) SQL job queues take `indexNames` to name their indexes. The queue always created `idx_kmsg_jobs_dequeue` and `idx_kmsg_jobs_id`, whatever its `tableName`, but SQLite and D1 need index names to be unique per database, and Postgres per schema. So a second queue table in the same one got no indexes: its `CREATE INDEX IF NOT EXISTS` found the first table's and skipped, and its dequeues scanned the whole table. `HyperdriveJobQueue`, `createD1JobQueue`, `createDrizzleJobQueue`, and `buildJobQueueSchemaSql` take `indexNames: { dequeue, id }`, and `buildCloudflareSqlSchemaSql`, `initializeCloudflareSqlSchema`, and `renderDrizzleSchemaSource` take `queueIndexNames`. Names left out keep their defaults. `init()` never drops indexes, so a table that already has the default ones keeps them next to the new ones. — Thanks @imjlk!
- [8d0db3ba](https://github.com/k-otp/k-msg/commit/8d0db3baba2a18c6c94825c6bad08a7ab83bae4e) `DeliveryTrackingService.runOnce()` takes `{ signal, fetch }`, like `KMsg.send()`, and passes it to each provider status query, which it used to call without a request context. The signal also bounds the poll: once it aborts, no more queries start, those still running are cancelled, and the poll stores the statuses it has and ends, leaving the other records due. A cancelled query no longer counts as an attempt or marks the record `UNKNOWN`, a call that joins a poll in progress stops waiting when its own signal aborts, and a stopped poll starts no API fallback send: a failure that needs one is left for the next poll, or put back as the poll found it when the poll had already stored it. The fallback sender's context carries the poll's signal.
  
  Polls also lease the records they take through the new optional `DeliveryTrackingStore.leaseDue()` and `patchLeased()`, which the SQL stores and `InMemoryDeliveryTrackingStore` implement: another service polling the same store, such as an overlapping cron run, skips them until the poll stores their next check, so a message is not queried or sent a fallback twice at once. A poll stores each result through `patchLeased()`, only while it still holds the record (checked in the write itself, also where a patch rewrites encrypted fields), so a poll that ran past its lease cannot overwrite a newer result or send a fallback for a stale one; a poll whose status query throws ends only once its other queries settle, and one whose lease ran out before the store returned the records leaves them and rejects. On MySQL a lease is a locking read and update in one transaction, which `BunSqlDeliveryTrackingStore` now runs through Bun.SQL's `begin()`; a Hyperdrive client without `transaction()` polls without leasing, and its `patchLeased()` rejects. A poll that stops early hands back the records it did not finish through `releaseLeases()`, which leaves alone any record another poll has leased since. `polling.leaseMs` (5 minutes by default) is how long a lease lasts if it is never handed back; `0` turns leasing off. — Thanks @imjlk!
- [c96aca4c](https://github.com/k-otp/k-msg/commit/c96aca4ccba954c87f8637d4ff547fa1ffd7add0) The SQL job queues (`HyperdriveJobQueue`, and so `createD1JobQueue` and `createDrizzleJobQueue`, and `SQLiteJobQueue`) can lease the jobs they hand out, as the KV, R2 and Durable Object queues can, with the same `leaseMs` and `onLeaseExpired` options. Without a lease, `dequeue()` marks a job `processing` for good, so a job whose worker stopped mid-job is never tried again. With `leaseMs`, a job that is neither completed nor failed in time is due again at the next `dequeue()`, with the lost attempt counted as failed (`error: "LEASE_EXPIRED"`), or fails when no attempts are left. Leases are off by default.
  
  The lease needs no schema change: while a job is processing under a lease, `process_at` holds when the lease ends, and the job carries it as `leaseExpiresAt`. `dequeue()` settles expired leases and takes the next job in one statement on Postgres (`FOR UPDATE SKIP LOCKED`), in two atomic statements on SQLite and D1, and in a transaction on MySQL. A job already `processing` when leases are turned on cannot be told from one whose lease expired, so it is due at once.
  
  The SQL queues also:
  - tell when they next have work: `nextDueAt()` is the earliest pending due time or lease end;
  - no longer let `fail()` reopen a completed job, and count its attempt in SQL;
  - take `cleanupTerminal({ olderThan, statuses })` to keep recently finished jobs, still accepting a statuses array.
  
  `dequeue({ running })` leaves the jobs its caller is still running alone, as in the object queues, and with `onLeaseExpired` the callbacks run before `dequeue()` leases the job it returns. `size()` and `peek()` count a job whose lease has expired. In every queue, `leaseMs` and retry delays are whole milliseconds; a fraction rounds up. The shared `JobQueue` interface declares `nextDueAt()` and `cleanupTerminal(options)` as optional methods, `Job` has `leaseExpiresAt`, and `@k-msg/messaging/queue` exports `JOB_LEASE_EXPIRED` with the `JobLeaseOptions` and `JobQueueCleanupOptions` types. `SQLiteJobQueueOptions`, `HyperdriveJobQueueConfig` and `HyperdriveJobQueueOptions` are exported too. — Thanks @imjlk!
- [62983844](https://github.com/k-otp/k-msg/commit/62983844ff30bdfcf328d8647b93eb2d15a26c12) SQL job queues take `initializeSchema: false` to skip creating their table and indexes. `HyperdriveJobQueue`, `createD1JobQueue`, and `createDrizzleJobQueue` sent a `CREATE TABLE` and two `CREATE INDEX` statements before the first query of every new queue, which in a Worker means every request, and needed a role allowed to run DDL. With the option set, `init()` does nothing and the schema is left to migrations, as the SQL delivery tracking stores already allow. The second argument of `new HyperdriveJobQueue(client, ...)` takes a table name, as before, or `{ tableName, initializeSchema }`. — Thanks @imjlk!

### Patch changes

- [821ed929](https://github.com/k-otp/k-msg/commit/821ed929bc38bf045fe83f14e48b2d25270df13a) Store JSON columns as JSON on Postgres, and read them back whatever the driver. `HyperdriveDeliveryTrackingStore` and `HyperdriveJobQueue` bound JSON text directly, and postgres.js and Bun.SQL (so also `BunSqlDeliveryTrackingStore`) serialize a parameter that Postgres types as `JSONB` with `JSON.stringify`, so `last_error`, `metadata`, `raw`, `metadata_hashes` and the queue's `data` and `metadata` were stored as JSON strings, which `last_error->>'code'` reads as `NULL`. JSON parameters are now typed as text and cast to `JSONB` in SQL. On the way back, drivers that decode JSON columns, such as node-postgres, mysql2 and Bun.SQL on MySQL, made the store drop `lastError` and `metadata` and the queue return `{}` for every job's data. JSON columns are now selected as text and read back exactly as stored. `last_error`, `metadata`, `metadata_hashes` and the queue's `metadata`, which always hold objects, also read the JSON strings that earlier versions stored. `raw` and the queue's `data` may hold any value, so for those the README shows the SQL that converts old rows. On Postgres, JSON values' NUL characters and unpaired surrogates are stored as U+FFFD, since `JSONB` cannot hold them. — Thanks @imjlk!
- [8d0db3ba](https://github.com/k-otp/k-msg/commit/8d0db3baba2a18c6c94825c6bad08a7ab83bae4e) `DeliveryTrackingService.close()` no longer closes the store under a poll in progress, including one still setting up the store. It stops the poll as if its signal had aborted, waits for it to store the statuses it has, and then closes the store, after which the service does not poll again. It does not wait for status changes still being delivered to `onStatusChange`, and a fallback send in progress is cancelled only if the sender passes on its context's signal. A poll run by `start()` that fails is logged once through the `@k-msg/core` logger instead of being dropped, and a tick that comes while a poll is still running is skipped rather than joining it. — Thanks @imjlk!
- [755c4316](https://github.com/k-otp/k-msg/commit/755c43160261435711e1bb47083dd5e49ed9d9d9) The MySQL tracking schema can be created with the default `typeStrategy`. MySQL cannot index a `TEXT` column (error 1170), and the SQL schema from `buildDeliveryTrackingSchemaSql()`, `buildCloudflareSqlSchemaSql()` and the SQL stores' `init()` made `message_id`, `provider_id` and `provider_message_id` `TEXT` by default (and `status` with `shortText: "text"`), so MySQL needed `typeStrategy: { messageId: "varchar", id: "varchar" }`. On MySQL, the primary key and the indexed columns (with field encryption, also `to_hash`, `from_hash` and `retention_class`) are now `VARCHAR(255)`, or `VARCHAR(64)` for short text, whatever `typeStrategy` says; the other columns still follow it. `renderDrizzleSchemaSource()` now declares the same MySQL types as the SQL schema, instead of `varchar(255)` for every id column and `text` for JSON columns: JSON columns are `json()` unless `typeStrategy.json` is `"text"`, and the field encryption columns no index covers are `text()` unless `typeStrategy.id` is `"varchar"`. Tables created from an earlier Drizzle schema keep working; the README shows the options that keep that schema and the SQL that migrates it. — Thanks @imjlk!
- [a7ce11a7](https://github.com/k-otp/k-msg/commit/a7ce11a7dfeeab1413c39df405220f40a5030cfb) The Durable Object job queue and delivery tracking store read each value from the storage listing, a page at a time, instead of calling `get()` for every key. Reading every job or record under the prefix now costs one `list()` call per 1,000 keys. `CloudflareObjectStorage` gains an optional `entries(prefix)` that yields them, which `createDurableObjectStorage` implements. KV and R2 listings carry no values, so those still read each key. — Thanks @imjlk!
- [59933acf](https://github.com/k-otp/k-msg/commit/59933acf0bf4702b68a3bb76b2d1fdb5001a9549) The field-crypto backfill encrypts rows on Postgres. `applyFieldCryptoMigration()` and `retryFieldCryptoMigration()`, which `k-msg db tracking migrate apply` and `retry` run, read their cursor through unquoted camelCase aliases, which Postgres folds to lowercase. They found no rows and marked the run completed with nothing encrypted. Such a run never moved its cursor, so running `apply` again with the same plan now encrypts the table. The backfill also wrote `metadata_hashes` through postgres.js and Bun.SQL as a JSON string, the bug the tracking store had before its JSON parameters were cast, and now stores it as a JSON document. Metadata that those drivers stored as a JSON string is now read as its object, as the store reads it, instead of being encrypted as missing. — Thanks @imjlk!
- [578e36bf](https://github.com/k-otp/k-msg/commit/578e36bfae4f5726e3754ae83db479472938113a) `provider_status_message` is now `TEXT` in the SQL and Drizzle tracking schemas on Postgres and MySQL, whatever `typeStrategy.shortText` is. As `VARCHAR(64)`, a longer provider message failed its status update with `value too long`. Existing tables keep the old column; widen it with `ALTER TABLE kmsg_delivery_tracking ALTER COLUMN provider_status_message TYPE TEXT` on Postgres or `ALTER TABLE kmsg_delivery_tracking MODIFY provider_status_message TEXT` on MySQL. — Thanks @imjlk!
- [85913424](https://github.com/k-otp/k-msg/commit/8591342485ed29fe52117c2348b226f5637242e6) Find tracking records by `to` and `from` under tenant keys and after a key rotation. Writes hashed these fields with the key `keyResolver.resolveEncryptKey` returned, but lookups hashed with the provider's default key, so a filter found nothing once the two differed. A lookup now hashes each value under that key, every key from `resolveDecryptKeys`, and the provider's default key, and matches any of them, so records written before a resolver was configured stay findable too. Like a write, which resolves keys with its record's `providerId` and `messageId`, a lookup also resolves them for each provider and message its filter pins. Degraded (fail-open) writes and metadata hashes use the resolved key as well. A degraded write falls back to the provider's default key when the resolver fails, and to an empty recipient hash, which no lookup matches, when it cannot hash at all; it no longer throws.
  
  A lookup that cannot resolve a key or compute a hash reports `crypto_fail_count` with `operation: "hash"`. With `failMode: "open"`, it keeps the keys that did resolve, and a secure-mode lookup left with no hash matches no records; it used to drop the filter and match every record. With `failMode: "closed"`, every kid `resolveDecryptKeys` lists needs a hash key, or lookups fail.
  
  On SQLite, including D1, a lookup binds its list of hashes as one JSON parameter, so neither the candidate keys nor a long recipient list push it past D1's limit of 100 bound parameters per statement. — Thanks @imjlk!
- [7af6951a](https://github.com/k-otp/k-msg/commit/7af6951a1e9395dd21ca66156ad4b9f88bb890e8) `DeliveryTrackingService.runOnce()` no longer stops at the first update the store rejects. The rest of the batch is still stored and still gets API failover. A record whose update the store rejects is checked again after its next backoff delay, so a record the store keeps rejecting cannot take a batch slot on every poll. `runOnce()` then rejects with an `AggregateError` that lists the failures and names the first one. — Thanks @imjlk!
- [b77cda55](https://github.com/k-otp/k-msg/commit/b77cda550391892e23cca9d3708ee8b352b00c8a) `metadata_enc` is now `TEXT` in the SQL and Drizzle tracking schemas on every dialect, whatever `typeStrategy.id` says. It holds the encrypted metadata, which passes 255 characters once the metadata JSON is about 110 characters long, so as the `VARCHAR(255)` that `id: "varchar"` gave it, a record with metadata encryption failed its write (MySQL error 1406, Postgres `value too long`). Existing tables keep the old column; widen it with `ALTER TABLE kmsg_delivery_tracking ALTER COLUMN metadata_enc TYPE TEXT` on Postgres or `ALTER TABLE kmsg_delivery_tracking MODIFY metadata_enc TEXT` on MySQL. — Thanks @imjlk!
- [b103a1ed](https://github.com/k-otp/k-msg/commit/b103a1ed2f596a9c09aa9aba16f8b8449132bb82) `typeStrategy: { timestamp: "integer" }` now gives the SQL and Drizzle tracking schemas `BIGINT` time columns on Postgres and MySQL, the same as the default `bigint`. As `INTEGER`, which is 32-bit there, the columns could not hold the epoch milliseconds the stores write (about 1.8 × 10¹²), so every insert failed: `integer out of range` on Postgres, `Out of range value` on MySQL, which without strict mode stored 2147483647 instead. The stores still write epoch milliseconds, and SQLite and D1 keep `INTEGER`, which is 64-bit there, so tables that work today are unchanged. Postgres and MySQL tables already created with `INTEGER` time columns keep them; widen them to `BIGINT` with the `ALTER TABLE` statements in the README. Rows that MySQL without strict mode stored as 2147483647 keep that value, and polling marks them `UNKNOWN` (`TRACKING_TIMEOUT`); the README shows how to delete them. — Thanks @imjlk!
- [c96aca4c](https://github.com/k-otp/k-msg/commit/c96aca4ccba954c87f8637d4ff547fa1ffd7add0) `HyperdriveJobQueue.dequeue()` no longer hands one job to two workers on D1, SQLite or MySQL. It read the next job and marked it `processing` in separate statements, which D1 runs one at a time with nothing holding the row between them, and on MySQL the read took no lock and the write did not check the status. Two workers dequeueing at once could both get the same job; on MariaDB, four workers took the same job up to four times. On SQLite and D1, taking a job is now one `UPDATE ... RETURNING` statement. On MySQL, the queue finds the job with a plain read, then locks it by id and checks that it is still pending, which holds at any isolation level when the client has `transaction()`. Concurrent MySQL dequeues can wait on each other for a row.
  
  Jobs read from `HyperdriveJobQueue` also no longer carry the current time as `completedAt` and `failedAt` when those columns are empty. — Thanks @imjlk!
- [e45a8dd3](https://github.com/k-otp/k-msg/commit/e45a8dd393fa80cb0559152795176e8e12aa671d) The field-crypto migration runs on MySQL. Its state tables keyed on `TEXT` columns, which MySQL cannot index (error 1170), so `planFieldCryptoMigration()` failed there, as did the SQL from `buildFieldCryptoMigrationMetaSchemaSql()` and `includeMigrationMeta`; `plan_id` and the chunks table's `status` are now `VARCHAR` on MySQL. `ensureFieldCryptoMigrationStateTables()`, which plan, apply, retry and status each run, also created the chunk status index every time, and MySQL rejects that once the index exists (error 1061), so every call after the first failed; it now skips an existing table or index, as `initializeCloudflareSqlSchema()` does. Both now build the tables from the same statements. — Thanks @imjlk!
- [f46c40f8](https://github.com/k-otp/k-msg/commit/f46c40f86cc14df7470f591c3290973ebdcf1d19) The SQL job queue's `delay` column is now `BIGINT` on Postgres and MySQL, in `buildJobQueueSchemaSql()`, `buildCloudflareSqlSchemaSql()`, the queues' `init()` and `renderDrizzleSchemaSource()`. It holds milliseconds, and as a 32-bit `INTEGER` it could not take a delay of 2^31 ms (about 24.9 days) or more, so `HyperdriveJobQueue` and `createDrizzleJobQueue` failed to enqueue such a job: `integer out of range` on Postgres, `Out of range value` on MySQL, which without strict mode stored 2147483647 instead (the job still ran at its `process_at`). SQLite and D1 keep `INTEGER`, which is 64-bit there. Existing tables keep their column; widen it with `ALTER TABLE kmsg_jobs ALTER COLUMN delay TYPE BIGINT` on Postgres or `ALTER TABLE kmsg_jobs MODIFY delay BIGINT NOT NULL DEFAULT 0` on MySQL. — Thanks @imjlk!
- [6d98bd10](https://github.com/k-otp/k-msg/commit/6d98bd10ca14436e97d9b6b10b8848e5f1c7ebf4) SQL delivery tracking stores create their indexes under the names set in `indexNames` or `trackingIndexNames`. `HyperdriveDeliveryTrackingStore.init()` always used the default `idx_kmsg_delivery_*` names, and `createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, and `BunSqlDeliveryTrackingStore` dropped both options. Index names are unique per database in SQLite and D1 and per schema in Postgres, so a second tracking table there got no indexes at all. Existing indexes are left in place: where an earlier version created the default-named indexes for a store with custom names, `init()` now adds the configured ones next to them, which makes the default-named ones on that table redundant. — Thanks @imjlk!
- Updated dependencies: core@0.32.0, template@0.32.0

## 0.31.0 — 2026-09-26

### Minor changes

- [54cb2fb9](https://github.com/k-otp/k-msg/commit/54cb2fb991f6537a4f0718dfff88f854b12df3ce) `@k-msg/messaging` exports the `KMsgConfig`, `KMsgRoutingConfig`, `KMsgDefaultsConfig`, and `RoutingStrategy` types, so configuration built outside the `KMsg` constructor can be typed, and `estimateSmsBytes(text)`, which counts bytes the way `KMsg` does to choose between SMS and LMS (one per ASCII character, two per other character). The `k-msg` facade re-exports the three config types and `estimateSmsBytes`, and the `DeliveryStatus` type from `@k-msg/core`. — Thanks @imjlk!
- [b4d1b9b6](https://github.com/k-otp/k-msg/commit/b4d1b9b6ec18bc652c052e4f6ab95fb51e8e9cbd) Encrypt the field-crypto migration backfill instead of copying plaintext: `applyFieldCryptoMigration` and `retryFieldCryptoMigration` now require the tracking store's `fieldCrypto` options and encrypt rows whose `crypto_state` is empty, `plain`, or `degraded` through the same write path as the store. The backfill can run alongside live writes: it updates a row only while the row's state, recipient, sender, provider, and metadata still match what it read, re-encrypts the row's current values otherwise, and confirms each write by re-reading the row when the driver reports no affected-row count. Chunks after the first no longer fail on SQLite, D1, and MySQL, a failed row read or state write marks the run failed instead of leaving it running, and a row with no plain recipient fails its chunk instead of being skipped. `retryFieldCryptoMigration` only changes a run that has failed chunks to reprocess, so it no longer flips completed or read-failed runs back to running. The CLI `db tracking migrate apply/retry` commands read the keys from `KMSG_FIELD_CRYPTO_KEYS` and `KMSG_ACTIVE_KID`, accepting base64url or standard base64 keys and rejecting truncated ones before the backfill starts, and `KMSG_FIELD_CRYPTO_AAD_FIELDS` mirrors a store's `aadFields`. Both commands exit with code 3 when the run fails. — Thanks @imjlk!
- [34343b31](https://github.com/k-otp/k-msg/commit/34343b31b4842fb7e6c59b6522901eab5c2a06f3) SQL delivery tracking stores take `initializeSchema: false` to skip creating their table and indexes. `HyperdriveDeliveryTrackingStore`, `createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, and `BunSqlDeliveryTrackingStore` ran four `CREATE ... IF NOT EXISTS` statements before the first query of every new store, which in a Worker means every request, and needed a role allowed to run DDL. With the option set, `init()` does nothing and the schema is left to migrations, as `createD1WebhookPersistence` already allowed. — Thanks @imjlk!
- [4f715ca1](https://github.com/k-otp/k-msg/commit/4f715ca11bfcfcfb06c83f7b70c0be21f7295b5a) Errors thrown by `KMsg` observer hooks (`onSuccess`, `onError`, `onQueued`, `onRetryScheduled`, `onFinal`) no longer change the send result. Before, a throwing `onSuccess` after the provider accepted a message made `send()` report a failure and update a `full` persistence record to `FAILED`, inviting a duplicate resend. Such errors now go to the new optional `onHookError(error, { hook, context })` hook, or to `console.error` without it. `onBeforeSend` still aborts the send by throwing, and a send rejected by provider onboarding checks now ends with `onFinal` like every other failure. — Thanks @imjlk!
- [ec4b2b20](https://github.com/k-otp/k-msg/commit/ec4b2b20bdd9ef9323416f429507ebefd4fdf6a6) `DeliveryTrackingService` takes an `onStatusChange` callback, called for each record a poll stored with a different status (with the record as stored and its previous status) once the poll finishes, so an app can notify a webhook or a user when a message is delivered or fails. Calls run one at a time in the order changes were stored, each with its own copy of the record. `runOnce()` resolves once its changes have been delivered, so a cron or request handler that awaits it does not end before they run; a callback may call `runOnce()` itself, and that call resolves once the poll's changes are queued, since they are delivered after the callback. If it throws, polling continues and the error goes to `onStatusChangeError`, or `console.error` without one. Delivery is best effort: a change whose callback throws is not retried, and services polling the same store can each report a change, so the callback should be idempotent. The `DeliveryStatusChange` type is exported from `@k-msg/messaging/tracking`. — Thanks @imjlk!
- [3186ad44](https://github.com/k-otp/k-msg/commit/3186ad4455bb1b9aec276ad007ff5faa1fab38d7) `KMsg.send()` and `sendOrThrow()` take an optional second argument, `{ signal, fetch }`, that is forwarded to the provider for that call, so a send can be cancelled or given a timeout (`{ signal: AbortSignal.timeout(5_000) }`) or routed through a custom `fetch`. A batch shares it. Providers already accepted this request context, but `KMsg` never passed it. The README's bulk sending section also documented a `sendMany()` method that no longer exists; it now shows `send([...])`. — Thanks @imjlk!
- [bb420a9d](https://github.com/k-otp/k-msg/commit/bb420a9d2c6a5a1cf3032003ee7ec0840c6f9931) `KMsg` fills `#{variable}` placeholders in ALIMTALK `failover.fallbackContent` and `failover.fallbackTitle` from the message's `variables`, as it does for SMS text; providers used to send the placeholders as written. When `failover.fallbackChannel` is omitted, `KMsg` now sets it from the filled-in text: `lms` if it is longer than `defaults.sms.autoLmsBytes` (90 bytes), otherwise `sms`. The tracking-based API fallback follows that channel, and for a record without one it sends text over 90 bytes as LMS instead of always sending SMS. — Thanks @imjlk!

### Patch changes

- [1e1a1704](https://github.com/k-otp/k-msg/commit/1e1a17049600022dec79ec74dd2c952653a5c8b4) `JobProcessor`, `MessageRetryHandler`, and `DeliveryTracker` now log failures in their background work through the `@k-msg/core` logger instead of leaving them as unhandled promise rejections, which end a Node.js process by default. A job queue that throws while being polled, an `onRetryFailed` or `onRetryExhausted` callback that rejects, or a throwing `webhook:failed` listener no longer crashes the process, and the polling and retry loops keep running. `BulkMessageSender` also logs an unexpected failure of its batch loop, which it used to discard after marking the job failed. — Thanks @imjlk!
- [ea626822](https://github.com/k-otp/k-msg/commit/ea626822ed249cadb86397df6434b9e1962bc587) Fix `require()` in Node. The CommonJS build shipped as `.js` files in `"type": "module"` packages, so Node loaded it as ESM and `require()` threw `ReferenceError: module is not defined in ES module scope`. The CommonJS build now ships as `.cjs`, and `main` and every `require` export condition point at it. `require()` and `import()` expose the same export names; `import` still resolves to the `.mjs` build. — Thanks @imjlk!
- [7d1052ca](https://github.com/k-otp/k-msg/commit/7d1052ca6b23d5e74d42d4958d63cf606eb45176) `createD1SqlClient` no longer runs a failed statement a second time. When `all()` threw, it ran the statement again with `run()`, which could apply a write twice or report a failed statement as successful, and without `run()` it replaced the D1 error with a generic "D1 statement execution failed". It now runs each statement once, with `all()`, and rethrows the D1 error unchanged. This affects the D1 tracking store and job queue built on it. — Thanks @imjlk!
- [47d98559](https://github.com/k-otp/k-msg/commit/47d985596f1696dc0e5af8facb340193862d3cc2) `validateFieldCryptoConfig` rejects unknown `failMode` and `openFallback` values, and the messaging and webhook crypto paths fail closed unless `failMode` is exactly `"open"`. A misspelled mode such as `"close"` from JSON configuration used to count as fail-open, storing masked or empty fallbacks when encryption failed. `resolveFieldCryptoFailMode` exposes the rule, and `resolveFieldCryptoOpenFallback` resolves an unrecognized `openFallback` to `"masked"` in both packages (messaging used to store an empty value for it). — Thanks @imjlk!
- [8a827273](https://github.com/k-otp/k-msg/commit/8a82727373cb5628615cffaaabc0870a1964c946) Encrypt tracking metadata with the key that `keyResolver.resolveEncryptKey` returns, as `to` and `from` already were. Metadata was encrypted with the provider's active key, so a tenant-specific or newly rotated key covered only part of a record. — Thanks @imjlk!
- [da238a4e](https://github.com/k-otp/k-msg/commit/da238a4ecf9fd88c0e9f7d2391aaf59db29c4670) Durable Object-backed tracking stores and job queues now see every key. Their storage listing made one call capped at 1000 keys, so records and jobs past the first 1000 were never listed; it now pages through with `startAfter`, as the KV and R2 listings already did. — Thanks @imjlk!
- Updated dependencies: core@0.31.0, template@0.31.0

## 0.30.0 — 2026-07-21

### Patch changes

- Updated dependencies: core@0.30.0, template@0.30.0

## 0.29.9 — 2026-07-20

### Patch changes

- [a07e08a](https://github.com/k-otp/k-msg/commit/a07e08aa4b39c2c610fd3895062fdd612cf80513) Restore valid ESM entrypoints in published packages and reject malformed or missing export artifacts before release. — Thanks @imjlk!
- Updated dependencies: core@0.29.9, template@0.29.9

## 0.29.8 — 2026-07-10

### Patch changes

- [dd68c83](https://github.com/k-otp/k-msg/commit/dd68c83cf05a11b4052a3a50ffed3908798a9bc4) Reduce duplicated runtime type declarations by deriving selected exported types from their Zod schemas while keeping existing public type names stable. — Thanks @imjlk!
- Updated dependencies: core@0.29.8, template@0.29.8

## 0.29.7 — 2026-06-29

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.29.7, template@0.29.7

## 0.29.6 — 2026-04-12

### Patch changes

- Updated dependencies: core@0.29.6, template@0.29.6

## 0.29.5 — 2026-04-12

### Patch changes

- [c3aeb65](https://github.com/k-otp/k-msg/commit/c3aeb6525eed6859c6bc3a614fb5751ece1f4989) Refresh the Bun/Bunli toolchain baselines, update the CLI for Bunli 0.9, and keep completion/build workflows working without depending on the broken upstream `bunli` executable path. — Thanks @imjlk!
- Updated dependencies: core@0.29.5, template@0.29.5

## 0.29.4 — 2026-03-08

### Patch changes

- [91b7e11](https://github.com/k-otp/k-msg/commit/91b7e112852282ef762b234b08adea9a5b41fe91) Improve docs navigation by turning the package and example hub pages into task-oriented decision guides with quick-pick tables and recommended reading paths. — Thanks @imjlk!
- Updated dependencies: core@0.29.4, template@0.29.4

## 0.29.3 — 2026-03-07

### Patch changes

- [94e38e9](https://github.com/k-otp/k-msg/commit/94e38e981d2f6ede91859814125cda54ad1af9a1) Improve docs release safety by failing CI when English docs navigation points to guide pages that do not actually exist. — Thanks @imjlk!
- Updated dependencies: core@0.29.3, template@0.29.3

## 0.29.2 — 2026-03-06

### Patch changes

- [66ff954](https://github.com/k-otp/k-msg/commit/66ff954de69fe12fe0a27830b877eecddf14d422) Fix follow-up runtime issues in the channel toolkit and messaging queue helpers.
  
  - Prevent `JobProcessor` from leaving processing slots stuck when a job type has no registered handler.
  - Make queue cleanup remove only terminal jobs instead of deleting pending work, and align queue-size metrics with the actual pending queue.
  - Remove deleted channel sender-number orphans during `ChannelCRUD` cleanup.
  - Remove the unused `MessageRetryHandler.enablePersistence` option and update the docs to match the real in-memory behavior. — Thanks @imjlk!
- Updated dependencies: core@0.29.2, template@0.29.2

## 0.29.1 — 2026-03-06

### Patch changes

- [5cd8774](https://github.com/k-otp/k-msg/commit/5cd87748dafe7f6cd18d5375244757e4d2167219) Clean up toolkit channel approval assumptions and make retry scheduling/execution explicit.
  
  - `@k-msg/channel`
    - treat toolkit channels as already-approved local records instead of modeling fake provider approval states
    - remove toolkit channel-level verification fields and the `KakaoChannelManager.completeVerification()` flow
    - make `KakaoChannelManager` create active channels immediately and fix deleted-channel listing behavior
  - `@k-msg/messaging`
    - make `JobProcessor.retryDelays` actually reschedule queued retries through queue adapters
    - change queue failure handling to use explicit retry scheduling metadata
    - redesign `MessageRetryHandler` to require an `execute(attempt, item)` callback instead of simulating retries
  
  Note: these changes include public API and behavior changes, even though this changeset is intentionally classified as `patch`. — Thanks @imjlk!
- Updated dependencies: core@0.29.1, template@0.29.1

## 0.29.0 — 2026-03-06

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.29.0, template@0.29.0

## 0.28.0 — 2026-02-28

### Minor changes

- [4c11ff5](https://github.com/k-otp/k-msg/commit/4c11ff5ac8859de63952370eb53722275a8987d9) Switch public schemas to zod/mini while preserving parse/safeParse behavior; schema concrete internals now use mini types. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.28.0, template@0.28.0

## 0.27.2 — 2026-02-28

### Patch changes

- [0f03230](https://github.com/k-otp/k-msg/commit/0f032306529f3e4b3c8ddc1135123cb901416098) Improve bundle split points for send-focused consumers without breaking existing imports.
  
  - Add provider subpaths for send/template separation:
    - `@k-msg/provider/iwinv/send`
    - `@k-msg/provider/iwinv/template`
    - `@k-msg/provider/aligo/send`
    - `@k-msg/provider/aligo/template`
  - Refactor `@k-msg/messaging/sender` to avoid static `zod` imports on the sender entry path.
  - Add `@k-msg/template/send` and `@k-msg/template/lifecycle` subpaths and mark template package as side-effect free.
  - Strengthen CI bundle checks with raw+gzip limits and forbidden-import guards for send-only artifacts. — Thanks @imjlk!
- Updated dependencies: core@0.27.2, template@0.27.2

## 0.27.1 — 2026-02-27

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.27.1, template@0.27.1

## 0.27.0 — 2026-02-26

### Patch changes

- [a3ac022](https://github.com/k-otp/k-msg/commit/a3ac02295a5156287912fd86036d612f1cf5a98c) optimize bundling boundaries and add lightweight core subpath
  
  - mark core/messaging/provider/k-msg as side-effect-free for better tree shaking
  - externalize workspace/runtime deps during package builds to reduce duplicated bundled payload across subpath entries
  - add `k-msg/core` subpath that re-exports `@k-msg/core` without pulling `KMsg` facade into the same entrypoint — Thanks @imjlk!
- Updated dependencies: core@0.27.0, template@0.27.0

## 0.26.0 — 2026-02-26

### Minor changes

- [688192d](https://github.com/k-otp/k-msg/commit/688192d53837838d12515222b4015779331324fe) feat(core,messaging,k-msg): add shared policy/normalization utilities with safe defaults and opt-out modes
  
  - core
    - expose canonical message/delivery status constants and guards
    - add terminal/pollable delivery helper utilities
    - add retry policy JSON parsing/validation helpers (`safe`/`compat`)
    - add provider error normalization helper with source trace metadata
  - messaging
    - add queue send-input builder with `safe` and `unsafe_passthrough` validation modes
    - route `MessageJobProcessor` payload transformation through the shared builder
    - align tracking internals with core terminal status helpers
  - k-msg facade
    - re-export new core helpers from the root package (status + policy/normalization APIs) — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.26.0, template@0.26.0

## 0.25.1 — 2026-02-26

### Patch changes

- [b2c0859](https://github.com/k-otp/k-msg/commit/b2c08591f360790f1c4e7c999cf820c59ee29288) Add Drizzle ORM `1.0.0-beta` compatibility metadata.
  
  - Extend `@k-msg/messaging` peer range to include `>=1.0.0-beta <1.0.0`
  - Add `drizzle-orm@beta` to the drizzle compatibility CI matrix
  - Refresh Drizzle compatibility tables in docs — Thanks @imjlk!
- Updated dependencies: core@0.25.1, template@0.25.1

## 0.25.0 — 2026-02-25

### Minor changes

- [bbf102d](https://github.com/k-otp/k-msg/commit/bbf102d150ec268500c7f8c6e0d3a922476ede9c) feat(dx): unified Provider imports, KMsg builder pattern, Result extensions, field-level crypto, comprehensive guides
  
  ## Breaking Changes
  - Legacy `Platform` / `UniversalProvider` / `StandardRequest` public APIs removed
  - Message discriminant is `type` (old `channel` naming removed)
  - `templateCode` renamed to `templateId`
  
  ## New Features
  
  ### API Improvements
  - **Unified Provider imports**: All providers now importable from `@k-msg/provider`
  - **KMsg.simple()**: One-liner for single provider setup
  - **KMsg.builder()**: Fluent API for complex configurations
  - **Result extensions**: `tap`, `tapOk`, `tapErr`, `expect` methods
  - **Error localization**: `KMsgError.getLocalizedMessage(locale)`
  
  ### Documentation
  - Getting started tutorial with Mock Provider
  - Message types comparison guide
  - Provider selection guide
  - Troubleshooting guide with FAQ
  - Use case guides (OTP, order notification, marketing)
  - DX v1 migration guide
  - Field crypto section with privacy warnings — Thanks Sisyphus!

### Patch changes

- Updated dependencies: core@0.25.0, template@0.25.0

## 0.24.1 — 2026-02-23

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.24.1, template@0.24.1

## 0.24.0 — 2026-02-22

### Minor changes

- [c0490a9](https://github.com/k-otp/k-msg/commit/c0490a9056a9ed5a526383a03700696bab178486) Add P1 key-management abstraction for field crypto:
  
  - add `createEnvKeyResolver`, `createAwsKmsKeyResolver`, `createVaultTransitKeyResolver`
  - add rollout policy helpers (`ActiveKidRolloutPolicy`, deterministic bucket selection)
  - add `createRollingKeyResolver` for active-kid gradual rollout while keeping multi-kid decrypt safety
  - expand tracking decrypt candidate resolution to include ciphertext envelope `kid` — Thanks @imjlk!
- [d9b33e9](https://github.com/k-otp/k-msg/commit/d9b33e9b4202ab6854cb380b89b84dbf1dec1fba) Add P1/P2 wave-3 crypto hardening and operations features:
  
  - `@k-msg/core`
    - extend crypto metric/control signal types with circuit-state event model
  
  - `@k-msg/messaging`
    - add `CryptoCircuitController` and control-signal configuration for delivery tracking crypto
    - emit circuit-state metrics (`crypto_circuit_state`, `crypto_circuit_open_count`) on encrypt/decrypt paths
    - add regression tests for scope-level circuit behavior
  
  - `@k-msg/webhook`
    - apply `fieldCrypto` to runtime persistence paths (in-memory and D1 via store wrapper)
    - enforce runtime config validation for webhook `fieldCrypto` policies
    - remove legacy registry storage options `enableEncryption` / `encryptionKey`
  
  Also update CI/docs operations:
  
  - add docs-check retry script and CI workflow improvements for flaky canceled/timeout behavior
  - add dedicated crypto regression CI job
  - expand security docs (ko/en + root docs) and CLI migration docs — Thanks @imjlk!
- [580d670](https://github.com/k-otp/k-msg/commit/580d67067b8a2b5263f0b8b3d9efcdb2d384010a) Add tracking SQL field-crypto migration orchestrator primitives:
  
  - add migration planning/execution/status/retry modules
  - add migration state tables and query helpers
  - add migration metadata schema SQL builder
  - add CLI command group: `k-msg db tracking migrate plan|apply|status|retry` (sqlite-first) — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.24.0, template@0.24.0

## 0.23.1 — 2026-02-22

### Patch changes

- [df9c3d7](https://github.com/k-otp/k-msg/commit/df9c3d78d3aa560412207d6021b564ec52e0602a) Harden field crypto P0 policy and improve beginner-facing security docs.
  
  - add fail-fast `fieldCrypto` policy validation API (`validateFieldCryptoConfig`, `assertFieldCryptoConfig`, `resolveFieldMode`)
  - enforce secure-mode config checks at tracking store initialization
  - strengthen fail-open metric tags and normalization consistency for hash lookups
  - apply the same validation policy to webhook registry crypto options
  - add plain-language security glossary/recipes in docs (ko/en) and root basics docs — Thanks @imjlk!
- Updated dependencies: core@0.23.1, template@0.23.1

## 0.23.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.23.0, template@0.23.0

## 0.22.3 — 2026-02-22

### Patch changes

- [b89c773](https://github.com/k-otp/k-msg/commit/b89c773685a9457e5718bfd4aa8cee9aafdfe063) Add `typeStrategy.timestamp = "date"` support for Cloudflare delivery tracking schema generation on PostgreSQL.
  
  - `renderDrizzleSchemaSource()` now renders Postgres tracking timestamps as `timestamp(..., { withTimezone: true, mode: "date" })` when `date` strategy is selected.
  - SQL schema generation maps Postgres timestamp columns to `TIMESTAMPTZ` for the same strategy.
  - Hyperdrive delivery tracking store now binds timestamp values as `Date` objects for Postgres when `date` strategy is enabled. — Thanks @imjlk!
- Updated dependencies: core@0.22.3, template@0.22.3

## 0.22.2 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.22.2, template@0.22.2

## 0.22.1 — 2026-02-22

### Patch changes

- [22e0212](https://github.com/k-otp/k-msg/commit/22e0212416885027776910b29a692a50a33c3841) Patch CI failures introduced after `0.22.0` by aligning lint/docs-generated artifacts with repository checks.
  
  - Remove explicit `any` usage in core error utilities.
  - Apply Biome formatting/import cleanup for changed source files.
  - Regenerate CLI help/docs artifacts required by `docs:check`. — Thanks @imjlk!
- Updated dependencies: core@0.22.1, template@0.22.1

## 0.22.0 — 2026-02-22

### Minor changes

- [aa04c40](https://github.com/k-otp/k-msg/commit/aa04c40b7cc608252168008fb66a78c0020c367a) Improve k-msg integration contracts for status normalization, retry policy centralization, and tracking observability.
  
  - Add safer status normalization so unknown provider states do not get finalized as immediate failures.
  - Expand retry/error utilities with policy-based classification and richer provider metadata propagation.
  - Extend send hook lifecycle for queued/retry-scheduled/final outcomes.
  - Add Cloudflare schema rendering options for delivery tracking index-name overrides.
  - Upgrade mock provider scenarios for deterministic timeout/failure/delay testing. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.22.0, template@0.22.0

## 0.21.1 — 2026-02-22

### Patch changes

- [ae66efd](https://github.com/k-otp/k-msg/commit/ae66efd3dc9a5e39a7bdd9ac460cc5e9aee14ee3) Fix delivery tracking schema option typing compatibility.
  
  - Accept legacy `trackingTypeStrategy` input in schema/config paths that previously switched to `typeStrategy`.
  - Ensure `createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `initializeCloudflareSqlSchema`, and drizzle SQL render helpers honor both option keys.
  - This preserves backward compatibility for existing consumers while keeping the new `typeStrategy` API. — Thanks @imjlk!
- Updated dependencies: core@0.21.1, template@0.21.1

## 0.21.0 — 2026-02-22

### Minor changes

- [47f10ed](https://github.com/k-otp/k-msg/commit/47f10ed37595617a4b9019994670dfb888212d6f) Improve delivery-tracking SQL schema flexibility and privacy defaults.
  
  - Keep default tracking table as `kmsg_delivery_tracking`, with additive schema options:
    `tableName`, `columnMap`, and `typeStrategy`.
  - Add `storeRaw` option across SQL tracking paths (Cloudflare/D1/Drizzle/Hyperdrive/Bun SQL/SQLite).
  - Change SQL default to `storeRaw: false` so provider raw payload is not persisted unless explicitly enabled.
  - Expose `getDeliveryTrackingSchemaSpec()` for SSOT-style schema sync tooling.
  - Add tests for schema rendering and store parity with `storeRaw` on/off.
  - Add docs sync guard (`scripts/docs/sync-tracking-schema-docs.ts`) and refresh messaging/analytics/example docs. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.21.0, template@0.21.0

## 0.20.0 — 2026-02-21

### Minor changes

- [adb3997](https://github.com/k-otp/k-msg/commit/adb3997754705ad24f7865e73e4bdff0f5a69360) Refactor template handling around `@k-msg/template` as the single runtime source of truth.
  
  ## `@k-msg/template` (minor)
  
  - introduce runtime-first API surface:
    - `TemplateLifecycleService`
    - `TemplatePersonalizer`, `defaultTemplatePersonalizer`, `TemplateVariableUtils`
    - `validateTemplatePayload`, `parseTemplateButtons`
  - split builder/registry/testing helpers to a dedicated subpath: `@k-msg/template/toolkit`
  - remove legacy root exports that overlapped service semantics (`TemplateService`, `MockTemplateService`, root-level builder/registry exports)
  - move personalization implementation from messaging into template package
  
  ## `@k-msg/messaging` (minor)
  
  - remove root personalization exports:
    - `VariableReplacer`
    - `VariableUtils`
    - `defaultVariableReplacer`
  - migration path: import the renamed equivalents from `@k-msg/template`
    - `TemplatePersonalizer`
    - `TemplateVariableUtils`
    - `defaultTemplatePersonalizer`
  
  ## `@k-msg/cli` (minor)
  
  - route `kakao template *` commands through `TemplateLifecycleService` instead of direct provider template method calls
  - apply template runtime validation (`validateTemplatePayload`, `parseTemplateButtons`) before provider requests for create/update flows
  
  ## `@k-msg/provider` (patch)
  
  - remove duplicate template interpolation path in Aligo send by reusing template runtime interpolation
  - apply shared template payload/button validation to Aligo and IWINV template create/update flows
  - normalize Aligo template button serialization through the shared template button parser/serializer — Thanks @imjlk!

### Patch changes

- [99721ca](https://github.com/k-otp/k-msg/commit/99721ca3389c5581b60fdb07f24efc4d03a8e576) Relax `drizzle-orm` peer support for `@k-msg/messaging` to include both `^0.44.0` and `^0.45.0`, while keeping the package's development baseline on `0.45.1`.
  
  Also add CI compatibility matrix coverage for Drizzle adapter flows against:
  
  - `drizzle-orm@0.44.7` (minimum verification target)
  - `drizzle-orm@0.45.1` (maximum verification target) — Thanks @imjlk!
- Updated dependencies: core@0.20.0, template@0.20.0

## 0.19.1 — 2026-02-21

### Patch changes

- [be87ed1](https://github.com/k-otp/k-msg/commit/be87ed17146915a4595bcd7c810c67a1de609cff) Fix Drizzle SQL client rendering for parameterized queries in Cloudflare adapters by returning a Drizzle-compatible query wrapper (`getSQL().toQuery()`) instead of a plain `{ sql, params }` object.
  
  This resolves runtime failures like `query.getSQL is not a function` when `createDrizzleDeliveryTrackingStore` and other Drizzle-backed Cloudflare adapters execute parameterized SQL against Postgres connections. — Thanks @imjlk!
- Updated dependencies: core@0.19.1

## 0.19.0 — 2026-02-19

### Minor changes

- [6a1562f](https://github.com/k-otp/k-msg/commit/6a1562f9e276b16e9125c94e71513b34888a976e) Add Cloudflare SQL schema generation APIs and Drizzle adapter helpers to `@k-msg/messaging`, including reusable SQL/Drizzle schema renderers and improved retry-safe lazy initialization for SQL-backed tracking stores and job queues.
  
  Add `k-msg db schema print` and `k-msg db schema generate` commands to `@k-msg/cli`, using `@k-msg/messaging/adapters/cloudflare` as the single source of truth for generated SQL and Drizzle schema output. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.19.0

## 0.18.2 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.18.2

## 0.18.1 — 2026-02-18

### Patch changes

- [f5a1e75](https://github.com/k-otp/k-msg/commit/f5a1e758537e0bab130db3b07591d72010edebd1) Optimization: refactor `KMsg.send(batch)` to use smart batching (provider-specific chunk limits) and remove unsafe type casts in interpolation logic. — Thanks @imjlk!
- Updated dependencies: core@0.18.1

## 0.18.0 — 2026-02-17

### Minor changes

- [373c0d3](https://github.com/k-otp/k-msg/commit/373c0d3b24986159045ddee065a05bfda1935cd3) Unify `KMsg.send` for single and batch inputs with built-in chunking, add configurable persistence strategies (`none`, `log`, `queue`, `full`) via a new message repository contract, and migrate bulk sending internals off `sendMany` to the unified `send` API. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.18.0

## 0.17.0 — 2026-02-17

### Patch changes

- [e03af15](https://github.com/k-otp/k-msg/commit/e03af158dbbc50b9dd9c6196afe56885df1a2848) Remove remaining Node runtime dependencies from analytics/messaging/runtime paths and standardize runtime-neutral environment variable access.
  
  - Replaced Node `events` usage with package-local runtime-neutral `EventEmitter` implementations.
  - Replaced `NodeJS.Timeout` annotations with `ReturnType<typeof setTimeout/setInterval>`.
  - Replaced direct `process.env` reads in core/provider defaults with global-compatible env resolution:
    `globalThis.__K_MSG_ENV__` -> `globalThis.__ENV__` -> `globalThis.process?.env`.
  - Removed `@types/node` from package-level devDependencies where no longer needed. — Thanks @imjlk!
- Updated dependencies: core@0.17.0

## 0.16.0 — 2026-02-17

### Patch changes

- [d0b4040](https://github.com/k-otp/k-msg/commit/d0b404088e5aed87c7b7211a0dab6f36bee2de13) Improve package boundaries and runtime safety across provider/messaging/cli:
  
  - Make package builds deterministic by running `clean` before each build pipeline.
  - Remove stale/unused dependencies and TS references in messaging/webhook/provider.
  - Add `@k-msg/provider/aligo` subpath export and keep `@k-msg/provider/solapi` as a dedicated subpath.
  - Externalize `solapi` from provider dist output while keeping it as optional peer dependency.
  - Update CLI provider registry to lazy-load SOLAPI only when configured, with clear install guidance when missing.
  - Remove unsafe `any` casting from CLI provider capability wiring and add registry boundary tests. — Thanks @imjlk!
- Updated dependencies: core@0.16.0

## 0.15.0 — 2026-02-17

### Patch changes

- [4c44fd6](https://github.com/k-otp/k-msg/commit/4c44fd69c33fc8c6a5ac64da136daeb37daf89ff) Split SOLAPI exports into `@k-msg/provider/solapi` and make `solapi` an optional peer dependency,
  while keeping runtime-neutral exports on `@k-msg/provider`.
  
  Also updated messaging cloudflare DO storage typing compatibility and refreshed docs/examples
  (including advanced Pages routes and new Bun/Express Node send-only templates). — Thanks @imjlk!
- Updated dependencies: core@0.15.0, provider@0.15.0, template@0.15.0

## 0.14.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.14.0, provider@0.14.0, template@0.14.0

## 0.13.0 — 2026-02-16

### Minor changes

- [d6440b8](https://github.com/k-otp/k-msg/commit/d6440b88137510a696cbbbe407f90b9828795599) Restructure messaging APIs into dedicated subpaths and keep the root export send-focused.
  
  - Move delivery-tracking APIs to `@k-msg/messaging/tracking`.
  - Move bulk sender to `@k-msg/messaging/sender`.
  - Move queue contracts to `@k-msg/messaging/queue` and expose `JobStatus` there.
  - Remove these symbols from `@k-msg/messaging` root.
  - Update `k-msg` and analytics internals to consume the new subpaths. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.13.0, provider@0.13.0, template@0.13.0

## 0.12.0 — 2026-02-16

### Minor changes

- [191c4ea](https://github.com/k-otp/k-msg/commit/191c4ea6e037baa7469e0ef7ffe1af8040e2a047) Split runtime-specific messaging implementations into adapter subpaths and keep root APIs runtime-neutral.
  
  - Remove `test-utils` from `@k-msg/core` public exports.
  - Enforce `IWINVProvider` MMS image input as `blob/bytes` only and drop Node-only file/path/buffer dependencies.
  - Add `@k-msg/messaging/adapters/{bun,node,cloudflare}` with Cloudflare support for Hyperdrive/Postgres/MySQL/D1 and KV/R2/DO-backed object adapters.
  - Sync `k-msg/adapters/{bun,node,cloudflare}` re-exports and package export maps. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.12.0, provider@0.12.0, template@0.12.0

## 0.11.0 — 2026-02-16

### Breaking changes

- Runtime-coupled symbols were removed from `@k-msg/messaging` root export:
  - `BunSqlDeliveryTrackingStore`
  - `SqliteDeliveryTrackingStore`
  - `SQLiteJobQueue`
  - `JobProcessor`
  - `MessageRetryHandler`
  - `createDeliveryTrackingHooks`
  - `DeliveryTrackingService`
  - `InMemoryDeliveryTrackingStore`
  - `BulkMessageSender`
  - `Job`
  - `JobQueue`
- Runtime-specific implementations now live under adapter subpaths:
  - `@k-msg/messaging/adapters/bun`
  - `@k-msg/messaging/adapters/node`
  - `@k-msg/messaging/adapters/cloudflare`
- Optional messaging features now live under dedicated subpaths:
  - `@k-msg/messaging/tracking`
  - `@k-msg/messaging/sender`
  - `@k-msg/messaging/queue` (`JobStatus` 포함)
- `JobProcessor` / `MessageJobProcessor` now require explicit `jobQueue` injection.
- Cloudflare adapters now support:
  - Hyperdrive/Postgres/MySQL (driver-injected SQL client)
  - D1 (`createD1SqlClient`/`createD1DeliveryTrackingStore`/`createD1JobQueue`)
  - KV/R2/DO-backed object-store adapters

### Patch changes

- Updated dependencies: core@0.11.0, provider@0.11.0, template@0.11.0

## 0.10.1 — 2026-02-16

### Patch changes

- Updated dependencies: core@0.10.1, provider@0.10.1, template@0.10.1

## 0.10.0 — 2026-02-16

### Minor changes

- [09fb135](https://github.com/k-otp/k-msg/commit/09fb135888bb5d764f5dc37f8b3555b30db25d09) Formalize provider onboarding specs and add CLI doctor/preflight flow for AlimTalk readiness checks.
  
  Introduce provider onboarding registry metadata, plusId policy enforcement for ALIMTALK send, and opt-in provider live integration workflow scaffolding.
  
  Lock IWINV endpoint handling to built-in defaults (no base URL env/config overrides) and remove those fields from CLI/provider examples and docs. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.10.0, provider@0.10.0, template@0.10.0

## 0.9.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.9.0, provider@0.9.0, template@0.9.0

## 0.8.0 — 2026-02-15

### Minor changes

- [02d8e88](https://github.com/k-otp/k-msg/commit/02d8e885003795c3a198053514d6598e657ba855) Replace the legacy CLI with a Bunli-based CLI and add Kakao Channel/Template
  management commands. Extend core/provider template APIs (TemplateProvider ctx,
  KakaoChannelProvider, TemplateInspectionProvider) and implement capabilities in
  IWINV/Aligo providers. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.8.0, provider@0.8.0, template@0.8.0

## 0.7.3 — 2026-02-15

### Patch changes

- [e9825cf](https://github.com/k-otp/k-msg/commit/e9825cfa0bfdf8c4ec2745c0fa42f46dd4b59a7e) Add query-based delivery tracking analytics.
  
  - `@k-msg/messaging`: extend `DeliveryTrackingStore` with optional query/count APIs and persist provider status/timestamps for reporting.
  - `@k-msg/analytics`: add `DeliveryTrackingAnalyticsService` that computes KPIs/breakdowns by querying a `DeliveryTrackingStore` (SQLite/Bun.SQL/memory). — Thanks @imjlk!
- Updated dependencies: core@0.7.3, provider@0.7.3, template@0.7.3

## 0.7.2 — 2026-02-15

### Patch changes

- Updated dependencies: core@0.7.2, provider@0.7.2, template@0.7.2

## 0.7.1 — 2026-02-15

### Patch changes

- [41c5f8d](https://github.com/k-otp/k-msg/commit/41c5f8dda1770d6d7213de8a99ef2eb693fbf50c) Fix delivery tracking for scheduled messages and preserve IWINV "pending" statuses during polling. — Thanks @imjlk!
- Updated dependencies: core@0.7.1, provider@0.7.1, template@0.7.1

## 0.7.0 — 2026-02-15

### Minor changes

- [8531a52](https://github.com/k-otp/k-msg/commit/8531a525c925995ca8ec2d2813e55c526e8e6196) Add delivery status tracking via provider polling (PULL), with pluggable stores (memory / SQLite / Bun.SQL) and provider delivery-status query capability. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.7.0, provider@0.7.0, template@0.7.0

## 0.6.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.6.0, provider@0.6.0, template@0.6.0

## 0.5.0 — 2026-02-14

### Minor changes

- [e9e79d8](https://github.com/k-otp/k-msg/commit/e9e79d84c1cbeb34c60f6f395d8e1740d7c8ccaa) Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.
  
  - Remove legacy Platform/UniversalProvider/StandardRequest public APIs
  - Rename `templateId` -> `templateCode`, and message discriminant to `type`
  - Refactor built-in providers to the unified `SendOptions + Result` interface — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.5.0, provider@0.5.0, template@0.5.0

## 0.4.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.4.0, provider@0.4.0, template@0.4.0

## 0.3.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.3.0, provider@0.3.0, template@0.3.0

## 0.2.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.2.0, provider@0.2.0, template@0.2.0

## 0.1.6 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.1.6, provider@0.1.6, template@0.1.6

## 0.1.5 — 2026-02-14

### Patch changes

- [92fe876](https://github.com/k-otp/k-msg/commit/92fe8769bbb6cb73f392498b71c30a882574a5c5) fix(release): republish to correct workspace dependency versions — Thanks @imjlk!
- Updated dependencies: core@0.1.5, provider@0.1.5, template@0.1.5

## 0.1.4 — 2026-02-14

### Patch changes

- [82173bf](https://github.com/k-otp/k-msg/commit/82173bff8a4e71fe76ec2913d38a60c3d409ac4e) test(release): verify npm OIDC trusted publishing — Thanks @imjlk!
- Updated dependencies: core@0.1.4, provider@0.1.4, template@0.1.4

## 0.1.3 — 2026-02-14

### Patch changes

- [f9ff20f](https://github.com/imjlk/k-msg/commit/f9ff20f80e2a950ae85500679445f7e1cc46b8c5) Fix published workspace dependency metadata by keeping bun.lock in sync with release versions. — Thanks @imjlk!
- Updated dependencies: core@0.1.3, provider@0.1.3, template@0.1.3

## 0.1.2 — 2026-02-14

### Patch changes

- [117d592](https://github.com/imjlk/k-msg/commit/117d59224e655dde1a599e8f694e421a12474a42) Bootstrap Sampo-driven release PR automation and Bun-based CI/CD. — Thanks @imjlk!
- Updated dependencies: core@0.1.2, provider@0.1.2, template@0.1.2
