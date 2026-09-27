# @k-msg/webhook

## 0.32.0 — 2026-09-27

### Minor changes

- [ae72304f](https://github.com/k-otp/k-msg/commit/ae72304f65f2d38eaa97dc8106b64ac371f5adb7) Registering an endpoint no longer replaces or duplicates another one. The D1 endpoint store wrote with `INSERT OR REPLACE`, so adding an endpoint whose URL was already registered silently replaced it with a new id and secret, and updating an endpoint to another endpoint's URL deleted that endpoint. The in-memory store kept both endpoints for a repeated URL, so every event went out twice, and replaced an endpoint that had the same id. Both stores now reject a repeated id or URL on `add()`, and a URL another endpoint uses on `update()`, with the new `WebhookEndpointConflictError` (`field`, `value`, `endpointId`), which `addEndpoint()` and `updateEndpoint()` pass on; `addEndpoints()` checks the whole batch against stored endpoints before storing any, an id or URL given twice in one call throws a plain `Error`, and if a write still fails partway, the endpoints already stored are kept, since removing them could delete another writer's endpoint, and the error names them. To register the same endpoint on every deploy, catch the error and call `updateEndpoint(error.endpointId, input)`. Custom `WebhookEndpointStore` implementations should reject duplicates the same way. — Thanks @imjlk!
- [5d8758b9](https://github.com/k-otp/k-msg/commit/5d8758b9c0cf69c97dad206b720d64e2b84a5854) Remove `BatchDispatcher` and its `BatchConfig` type from `@k-msg/webhook/toolkit`. It never sent an HTTP request: each job got a simulated result, a random 200 (about nine jobs in ten) or 500 with an invented latency, and `batchExecuted` counted every job as successful, so consumers saw deliveries that never happened. To batch deliveries, queue events with `WebhookRuntimeService.emit()`: the runtime sends them through `WebhookDispatcher` `batchSize` at a time, `flush()` or `shutdown()` sends what is still queued, and `listDeliveries()` returns each result. To deliver to an endpoint you manage yourself, call `WebhookDispatcher.dispatch(event, endpoint)` after checking its URL with `validateEndpointUrl()`. — Thanks @imjlk!
- [c49aa53d](https://github.com/k-otp/k-msg/commit/c49aa53d513325f63842c335c7ae5512f33e2e1a) `WebhookConfig.batchSize` and `batchTimeoutMs` are optional, defaulting to 10 events and 5000 ms, so a config used only with `emitSync()` can leave them out. A `batchSize` below 1 or not a number now also falls back to 10; before, it made `flush()` and `shutdown()` loop forever without sending anything. `Infinity` still leaves every event for `flush()` or the timer. — Thanks @imjlk!
- [50d3254d](https://github.com/k-otp/k-msg/commit/50d3254ddedfbfc5d2cc27960e863a4e844046df) Add `WebhookEventType.MESSAGE_CANCELLED` (`message.cancelled`) and `MESSAGE_UNKNOWN` (`message.unknown`), so every status a tracked message can move to after `PENDING` (`SENT`, `DELIVERED`, `FAILED`, `CANCELLED` and `UNKNOWN`) has a webhook event. As before, the application emits them, for example from delivery tracking's `onStatusChange`. — Thanks @imjlk!
- [9a6e5b12](https://github.com/k-otp/k-msg/commit/9a6e5b12522945c0abd3421465fca95d27f91991) Add `verifyWebhookRequest(headers, body, secret, { toleranceMs })` for receivers. It checks the signature over `<X-Webhook-Timestamp>.<body>` in constant time, then rejects a signed time more than `toleranceMs` (default five minutes) from now, allowing for the one-second resolution of the signed time, and returns a `Result` whose `WebhookVerificationError` has a `code` for each failed check. It reads `Headers` or Node-style header records and string, `Uint8Array` or `ArrayBuffer` bodies (bytes are checked exactly and must be valid UTF-8; the README verifies `await request.arrayBuffer()`, since `request.text()` drops a leading BOM and replaces malformed bytes before any check), and takes the sender's `algorithm`, `signatureHeader` and `signaturePrefix`. It throws for an empty secret or a `toleranceMs` that is negative, NaN or infinite. — Thanks @imjlk!
- [3fa4c734](https://github.com/k-otp/k-msg/commit/3fa4c734d9917c6986a86485e6a0807e994e8247) Never send a delivery unsigned while `enableSecurity` is on. An endpoint without a `secret`, when no `secretKey` was set either, was sent to without a signature. `addEndpoint()` and `updateEndpoint()` now throw for such an endpoint while it is active (an inactive one needs no secret, so it can be paused), and an active one already stored gets a `failed` delivery, with no request, whose attempt `error` says why. `probeEndpoint()` results now take `httpStatus` from the last attempt, not the first, and include its `error` when the probe fails, so a probe that was retried reports the status that decided it. — Thanks @imjlk!

### Patch changes

- [3fa4c734](https://github.com/k-otp/k-msg/commit/3fa4c734d9917c6986a86485e6a0807e994e8247) Sign each delivery attempt with the time it is sent. `X-Webhook-Timestamp` and the signature used the event's `timestamp`, and retries reused the first attempt's headers, so a receiver that rejects timestamps older than a few minutes also rejected retries and events that had waited in the queue. Every attempt now gets a fresh timestamp and signature, and a delivery's `headers` are those of its last attempt. An endpoint's own `headers` can no longer replace or duplicate (in another letter case) `X-Webhook-ID`, `X-Webhook-Event`, `X-Webhook-Timestamp` or the signature header, which made every delivery fail verification. — Thanks @imjlk!
- [c49aa53d](https://github.com/k-otp/k-msg/commit/c49aa53d513325f63842c335c7ae5512f33e2e1a) `WebhookRuntimeService` no longer starts a timer when it is created. With `autoStart` (the default) it started a `setInterval` in the constructor even if `emit()` was never called: a Worker that built a runtime per request leaked one interval per request, and a Node.js process with a runtime never exited until `shutdown()`. The batch timer now starts when `emit()` queues an event and stops once the queue is empty, `flush()` cancels it, and `emit()` after `shutdown()` starts none. A queued event still goes out `batchTimeoutMs` after the first one was queued, or as soon as a batch that is still being sent finishes, and a full batch queued meanwhile follows that batch at once. The README explains how to use `emit()` on Cloudflare Workers: `autoStart: false` and `ctx.waitUntil(runtime.flush())`, or `emitSync()`. — Thanks @imjlk!
- [63dc03e9](https://github.com/k-otp/k-msg/commit/63dc03e968a51a003f7ccdc4d6101bd043be7f99) Stop signing webhook deliveries with a fallback secret when field crypto fails open. With `fieldCrypto.endpoint.failMode: "open"`, an endpoint secret that could not be decrypted was returned as its masked fallback, or as the stored ciphertext with `openFallback: "null"` or `"plaintext"`, and deliveries were signed with it, so every receiver rejected them. Such an endpoint is now returned without `secret` and with the new `secretUndecryptable: true` flag, which survives JSON and `WebhookEndpointSchema` parsing, and while `enableSecurity` is on its deliveries and probes fail without a request, even when `secretKey` is set, with an attempt `error` saying the secret could not be decrypted. That includes `"plaintext"`, since a value that does not decrypt cannot be told apart from ciphertext, so a secret that fallback stored in plaintext is not used until it is set again. An `updateEndpoint()` no longer writes the fallback over the stored secret, which replaced it for good: an update that does not set `secret` keeps it, an unchanged secret that cannot be encrypted again is kept, and an update whose `secret` can be neither encrypted nor compared with the stored one fails. `WebhookRegistry` in `@k-msg/webhook/toolkit` does the same, and with endpoint field crypto its `updateEndpoint()` keeps the stored secret for an endpoint without a `secret` property, such as one read during an outage and passed through JSON; set `secret`, even to `undefined`, to remove it. Endpoint secrets and delivery payloads are also encrypted and returned exactly as given: surrounding whitespace was trimmed before encryption, so `addEndpoint()` returned a padded secret that deliveries were then not signed with. — Thanks @imjlk!
- [2b2824d0](https://github.com/k-otp/k-msg/commit/2b2824d0391763456f405fad827ad3ea70b7c7a8) Import `@k-msg/core`, `zod`, and `@noble/hashes` instead of bundling a copy of them into each entry point. Errors thrown by webhook code, such as `FieldCryptoError`, are now `instanceof` the `FieldCryptoError` and `KMsgError` classes you import from `@k-msg/core`, and a logger installed with `setGlobalLogger()` now receives webhook's log output. Both need your app and `@k-msg/webhook` to share one installed `@k-msg/core`, so install matching `@k-msg/*` versions. The ESM entries shrink from 69 KB to 29 KB (root), 98 KB to 57 KB (`toolkit`), and 29 KB to 9.5 KB (`adapters/cloudflare`). Export names are unchanged. — Thanks @imjlk!
- Updated dependencies: core@0.32.0

## 0.31.0 — 2026-09-26

### Minor changes

- [d7b8af17](https://github.com/k-otp/k-msg/commit/d7b8af17bf6c39e31bc5c770a5f0888bff0bfb5b) Reject webhook field crypto modes the storage cannot honor. The registry and runtime stores always encrypt the endpoint `secret` and the delivery `payload`, which must stay recoverable, but accepted `fields: { secret: "plain" }` or `{ payload: "mask" }` and silently encrypted anyway. Each store's config must now set its field (`secret` or `payload`) to `encrypt` or `encrypt+hash`; no lookup hash is stored for them in either mode. Ciphertext written with a `tenantId` is also bound to it, so a value copied between tenants' rows does not decrypt. Values written before tenant binding are rejected unless `fieldCrypto.acceptLegacyAad` is set; once every instance runs this version, run the new `runtime.migrateFieldCryptoToTenant()` (or `migrateWebhookFieldCryptoToTenant(persistence, fieldCrypto)`) to re-encrypt stored endpoint secrets and delivery payloads with the tenant, then remove the flag. Endpoint writes through that runtime wait for the migration; pause endpoint changes from other instances while it runs. Delivery stores gain an optional `replace()` and a `before` cursor for `list()`, which the migration uses to rewrite the history a page at a time; the built-in stores implement both, and a custom store must add them before migrating. — Thanks @imjlk!

### Patch changes

- [5d94352b](https://github.com/k-otp/k-msg/commit/5d94352ba793f4d1c4bb753f88d46e6bf8c6329f) Build the published bundles with Bun 1.4.2 instead of 1.3.9. Bundles that inline `zod/mini` no longer carry zod's unused locale and JSON Schema modules and shrink by 65–93%: for example, the `@k-msg/template` ESM entry drops from 286 KB to 41 KB and `@k-msg/webhook` from 303 KB to 61 KB. Export names are unchanged. — Thanks @imjlk!
- [ea626822](https://github.com/k-otp/k-msg/commit/ea626822ed249cadb86397df6434b9e1962bc587) Fix `require()` in Node. The CommonJS build shipped as `.js` files in `"type": "module"` packages, so Node loaded it as ESM and `require()` threw `ReferenceError: module is not defined in ES module scope`. The CommonJS build now ships as `.cjs`, and `main` and every `require` export condition point at it. `require()` and `import()` expose the same export names; `import` still resolves to the `.mjs` build. — Thanks @imjlk!
- [5e51b88f](https://github.com/k-otp/k-msg/commit/5e51b88f77ee20f07d74097134b34c96cfd557da) Fix `flush()`/`shutdown()` spinning while a batch is in flight, stop re-delivering already dispatched events after a failed batch, reject private IPv6/IPv4 endpoint hosts that URL canonicalization previously let through, stop following redirects during delivery, and apply a per-endpoint `maxRetries` (including 0) to every failure type instead of capping network errors at the global value. — Thanks @imjlk!
- [11373de2](https://github.com/k-otp/k-msg/commit/11373de2f0dfb3ab5d412a16c87d66da1496a020) `LoadBalancer` and `QueueManager` now log failures in their timer-driven work through the `@k-msg/core` logger instead of leaving unhandled promise rejections, which end a Node.js process by default. A throwing `healthCheckFailed` listener during a periodic health check, or a throwing `jobEnqueued` listener when a delayed job comes due, no longer crashes the process. — Thanks @imjlk!
- [47d98559](https://github.com/k-otp/k-msg/commit/47d985596f1696dc0e5af8facb340193862d3cc2) `validateFieldCryptoConfig` rejects unknown `failMode` and `openFallback` values, and the messaging and webhook crypto paths fail closed unless `failMode` is exactly `"open"`. A misspelled mode such as `"close"` from JSON configuration used to count as fail-open, storing masked or empty fallbacks when encryption failed. `resolveFieldCryptoFailMode` exposes the rule, and `resolveFieldCryptoOpenFallback` resolves an unrecognized `openFallback` to `"masked"` in both packages (messaging used to store an empty value for it). — Thanks @imjlk!
- [3910cd87](https://github.com/k-otp/k-msg/commit/3910cd8710ff5b8967a7ff7661c8f89cbe3b8db3) Stop storing a plaintext endpoint secret when encryption fails open with the `null` fallback. With `failMode: "open"` and `openFallback: "null"`, the empty fallback value was ignored and the endpoint kept its original secret, so the `WebhookRuntimeService` stores and `WebhookRegistry` persisted it in plaintext during a key service outage. Such an endpoint is now stored without a secret, and an endpoint whose secret cannot be decrypted under that fallback is returned without one instead of with its ciphertext. — Thanks @imjlk!
- [244468f4](https://github.com/k-otp/k-msg/commit/244468f402b59ff995ef392d9dc1113526f3e834) Validate ciphertext envelopes before they are stored. `toCiphertextEnvelopeString`, which the messaging tracking stores and now the webhook registry storage use, rejects an envelope object that is not `v: 1`, `alg: "A256GCM"` with string `kid`, `iv`, `tag`, and `ct`, and `assertCryptoEnvelopeV1` exposes the check. A custom provider could previously return any `v` or `alg` and have it persisted. A provider that returns its ciphertext as a string still owns that format. Only the envelope's own fields (`v`, `alg`, `kid`, `iv`, `tag`, `ct`) are stored, so extra properties a custom provider adds, such as debugging data, never reach storage. — Thanks @imjlk!
- [76fc95ee](https://github.com/k-otp/k-msg/commit/76fc95ee3e3a2c7f4c3986309e0a208e9c96b69b) Fix D1 webhook persistence setup. `createD1WebhookPersistence` created its tables with `db.exec()`, which D1 runs one line at a time, so the multi-line `CREATE TABLE` statements failed and every endpoint and delivery store call errored unless `initializeSchema: false` was set. Each schema statement now runs as its own prepared statement. — Thanks @imjlk!
- Updated dependencies: core@0.31.0

## 0.30.0 — 2026-07-21

### Patch changes

- Updated dependencies: core@0.30.0

## 0.29.9 — 2026-07-20

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.29.9

## 0.29.8 — 2026-07-10

### Patch changes

- [dd68c83](https://github.com/k-otp/k-msg/commit/dd68c83cf05a11b4052a3a50ffed3908798a9bc4) Reduce duplicated runtime type declarations by deriving selected exported types from their Zod schemas while keeping existing public type names stable. — Thanks @imjlk!
- Updated dependencies: core@0.29.8

## 0.29.7 — 2026-06-29

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.29.7

## 0.29.6 — 2026-04-12

### Patch changes

- Updated dependencies: core@0.29.6

## 0.29.5 — 2026-04-12

### Patch changes

- Updated dependencies: core@0.29.5

## 0.29.4 — 2026-03-08

### Patch changes

- [91b7e11](https://github.com/k-otp/k-msg/commit/91b7e112852282ef762b234b08adea9a5b41fe91) Improve docs navigation by turning the package and example hub pages into task-oriented decision guides with quick-pick tables and recommended reading paths. — Thanks @imjlk!
- Updated dependencies: core@0.29.4

## 0.29.3 — 2026-03-07

### Patch changes

- [94e38e9](https://github.com/k-otp/k-msg/commit/94e38e981d2f6ede91859814125cda54ad1af9a1) Improve docs release safety by failing CI when English docs navigation points to guide pages that do not actually exist. — Thanks @imjlk!
- Updated dependencies: core@0.29.3

## 0.29.2 — 2026-03-06

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.29.2

## 0.29.1 — 2026-03-06

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.29.1

## 0.29.0 — 2026-03-06

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.29.0

## 0.28.0 — 2026-02-28

### Minor changes

- [4c11ff5](https://github.com/k-otp/k-msg/commit/4c11ff5ac8859de63952370eb53722275a8987d9) Switch public schemas to zod/mini while preserving parse/safeParse behavior; schema concrete internals now use mini types. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.28.0

## 0.27.2 — 2026-02-28

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.27.2

## 0.27.1 — 2026-02-27

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.27.1

## 0.27.0 — 2026-02-26

### Patch changes

- Updated dependencies: core@0.27.0

## 0.26.0 — 2026-02-26

### Patch changes

- Updated dependencies: core@0.26.0

## 0.25.1 — 2026-02-26

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.25.1

## 0.25.0 — 2026-02-25

### Patch changes

- Updated dependencies: core@0.25.0

## 0.24.1 — 2026-02-23

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.24.1

## 0.24.0 — 2026-02-22

### Minor changes

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

### Patch changes

- Updated dependencies: core@0.24.0

## 0.23.1 — 2026-02-22

### Patch changes

- [df9c3d7](https://github.com/k-otp/k-msg/commit/df9c3d78d3aa560412207d6021b564ec52e0602a) Harden field crypto P0 policy and improve beginner-facing security docs.
  
  - add fail-fast `fieldCrypto` policy validation API (`validateFieldCryptoConfig`, `assertFieldCryptoConfig`, `resolveFieldMode`)
  - enforce secure-mode config checks at tracking store initialization
  - strengthen fail-open metric tags and normalization consistency for hash lookups
  - apply the same validation policy to webhook registry crypto options
  - add plain-language security glossary/recipes in docs (ko/en) and root basics docs — Thanks @imjlk!
- Updated dependencies: core@0.23.1

## 0.23.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.23.0

## 0.22.3 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.22.3

## 0.22.2 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.22.2

## 0.22.1 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.22.1

## 0.22.0 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.22.0

## 0.21.1 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.21.1

## 0.21.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.21.0

## 0.20.0 — 2026-02-21

### Minor changes

- [d9be998](https://github.com/k-otp/k-msg/commit/d9be9982d84ff67e5887775a0b1fbe19e889f826) Rewrite `@k-msg/webhook` around a runtime-first DX flow and add Cloudflare D1 persistence adapters.
  
  > Note: This release includes intentional breaking changes but is versioned as `minor` by repository policy.
  
  ## Highlights
  
  - root exports are now runtime-focused (`WebhookRuntimeService`, in-memory persistence helpers)
  - advanced classes moved to `@k-msg/webhook/toolkit`
  - new Cloudflare adapter subpath: `@k-msg/webhook/adapters/cloudflare`
    - `createD1WebhookPersistence`
    - `buildWebhookSchemaSql`
    - `initializeWebhookSchema`
  - endpoint registration no longer auto-sends probe webhooks
  - metadata filter matching now fail-close when required keys are missing
  - private-host URL policy defaults to deny unless explicitly allowed
  
  ## Migration
  
  - replace root `WebhookService` usage with `WebhookRuntimeService`
  - import advanced classes from `@k-msg/webhook/toolkit`
  - call `probeEndpoint()` explicitly when you need endpoint probe checks — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.20.0

## 0.19.1 — 2026-02-21

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.19.1

## 0.19.0 — 2026-02-19

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.19.0

## 0.18.2 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.18.2

## 0.18.1 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.18.1

## 0.18.0 — 2026-02-17

### Patch changes

- Updated dependencies: core@0.18.0

## 0.17.0 — 2026-02-17

### Minor changes

- [74549ef](https://github.com/k-otp/k-msg/commit/74549ef4ea2e9072829fb3ca7bf6aa145e91af90) Reorganize low-usage core APIs and expand real internal usage paths.
  
  - Removed `@k-msg/core` low-usage APIs: `config`, `health`, `types/history`, and high-level resilience helpers (`ErrorRecovery`, `GracefulDegradation`, `HealthMonitor`).
  - Added optional provider capability `BalanceProvider#getBalance(query?)` and implemented it in:
    - `IWINVProvider` (`ALIMTALK` default + `SMS/LMS/MMS` charge lookup)
    - `SolapiProvider` (single balance model mapped to `BalanceResult`)
  - Standardized analytics runtime logging to `@k-msg/core` logger (`console.*` removal in runtime paths).
  - Removed `apps/admin-dashboard` and `apps/message-service` from the monorepo.
  
  Note: This includes behavior/interface removals that can be considered breaking, but this release is intentionally marked as `minor` per current release policy request. — Thanks @imjlk!

### Patch changes

- [408608b](https://github.com/k-otp/k-msg/commit/408608bca6cb859f94e25ef02b1abe7c6009d3d5) Remove runtime dependence on Node built-ins in `@k-msg/webhook` so it can run in Edge environments without `nodejs_compat`.
  `events`, `node:crypto`, `fs/path`, `NodeJS.Timeout`, and direct `process.env` usage are replaced with runtime-neutral implementations.
  File persistence is now adapter-based via `fileAdapter`, and README docs include a Node compatibility adapter example. — Thanks @imjlk!
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

## 0.15.0 — 2026-02-17

### Patch changes

- Updated dependencies: messaging@0.15.0

## 0.14.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: messaging@0.14.0

## 0.13.0 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.13.0

## 0.12.0 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.12.0

## 0.11.0 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.11.0

## 0.10.1 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.10.1

## 0.10.0 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.10.0

## 0.9.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: messaging@0.9.0

## 0.8.0 — 2026-02-15

### Patch changes

- Updated dependencies: messaging@0.8.0

## 0.7.3 — 2026-02-15

### Patch changes

- Updated dependencies: messaging@0.7.3

## 0.7.2 — 2026-02-15

### Patch changes

- Updated dependencies: messaging@0.7.2

## 0.7.1 — 2026-02-15

### Patch changes

- [41c5f8d](https://github.com/k-otp/k-msg/commit/41c5f8dda1770d6d7213de8a99ef2eb693fbf50c) Fix delivery tracking for scheduled messages and preserve IWINV "pending" statuses during polling. — Thanks @imjlk!
- Updated dependencies: messaging@0.7.1

## 0.7.0 — 2026-02-15

### Minor changes

- [8531a52](https://github.com/k-otp/k-msg/commit/8531a525c925995ca8ec2d2813e55c526e8e6196) Add delivery status tracking via provider polling (PULL), with pluggable stores (memory / SQLite / Bun.SQL) and provider delivery-status query capability. — Thanks @imjlk!

### Patch changes

- Updated dependencies: messaging@0.7.0

## 0.6.0 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.6.0

## 0.5.0 — 2026-02-14

### Minor changes

- [e9e79d8](https://github.com/k-otp/k-msg/commit/e9e79d84c1cbeb34c60f6f395d8e1740d7c8ccaa) Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.
  
  - Remove legacy Platform/UniversalProvider/StandardRequest public APIs
  - Rename `templateId` -> `templateCode`, and message discriminant to `type`
  - Refactor built-in providers to the unified `SendOptions + Result` interface — Thanks @imjlk!

### Patch changes

- Updated dependencies: messaging@0.5.0

## 0.4.0 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.4.0

## 0.3.0 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.3.0

## 0.2.0 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.2.0

## 0.1.6 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.1.6

## 0.1.5 — 2026-02-14

### Patch changes

- [92fe876](https://github.com/k-otp/k-msg/commit/92fe8769bbb6cb73f392498b71c30a882574a5c5) fix(release): republish to correct workspace dependency versions — Thanks @imjlk!
- Updated dependencies: messaging@0.1.5

## 0.1.4 — 2026-02-14

### Patch changes

- [82173bf](https://github.com/k-otp/k-msg/commit/82173bff8a4e71fe76ec2913d38a60c3d409ac4e) test(release): verify npm OIDC trusted publishing — Thanks @imjlk!
- Updated dependencies: messaging@0.1.4

## 0.1.3 — 2026-02-14

### Patch changes

- [f9ff20f](https://github.com/imjlk/k-msg/commit/f9ff20f80e2a950ae85500679445f7e1cc46b8c5) Fix published workspace dependency metadata by keeping bun.lock in sync with release versions. — Thanks @imjlk!
- Updated dependencies: messaging@0.1.3

## 0.1.2 — 2026-02-14

### Patch changes

- [117d592](https://github.com/imjlk/k-msg/commit/117d59224e655dde1a599e8f694e421a12474a42) Bootstrap Sampo-driven release PR automation and Bun-based CI/CD. — Thanks @imjlk!
- Updated dependencies: messaging@0.1.2

