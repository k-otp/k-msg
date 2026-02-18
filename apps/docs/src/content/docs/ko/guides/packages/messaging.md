---
title: "@k-msg/messaging"
description: "Generated from `packages/messaging/README_ko.md`"
---
K-Message 플랫폼의 런타임 중립 메시징 코어 패키지입니다.

## 설치

```bash
npm install @k-msg/messaging @k-msg/core
# or
bun add @k-msg/messaging @k-msg/core
```

## 런타임 어댑터 경로

루트(`@k-msg/messaging`)는 런타임 중립 API만 제공합니다.

- `@k-msg/messaging/adapters/bun`
  - `BunSqlDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, `SQLiteJobQueue`
- `@k-msg/messaging/adapters/node`
  - `DeliveryTracker`, `JobProcessor`, `MessageJobProcessor`, `MessageRetryHandler`
- `@k-msg/messaging/adapters/cloudflare`
  - Hyperdrive/Postgres/MySQL/D1 SQL 어댑터
  - KV/R2/DO 기반 object storage 어댑터

## 마이그레이션 (Breaking)

- 루트(`@k-msg/messaging`)에서 제거된 심볼:
  - `BunSqlDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, `SQLiteJobQueue`
  - `JobProcessor`, `MessageJobProcessor`, `MessageRetryHandler`
  - `createDeliveryTrackingHooks`, `DeliveryTrackingService`, `InMemoryDeliveryTrackingStore`
  - `BulkMessageSender`
  - `Job`, `JobQueue`, `JobStatus`
- 대체 경로:
  - Bun 관련: `@k-msg/messaging/adapters/bun`
  - Node 관련: `@k-msg/messaging/adapters/node`
  - Tracking 관련: `@k-msg/messaging/tracking`
  - Sender 관련: `@k-msg/messaging/sender`
  - Queue 관련: `@k-msg/messaging/queue`
- `JobProcessor`/`MessageJobProcessor`는 이제 `jobQueue`를 반드시 주입해야 합니다.

## 기본 사용

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
});

await kmsg.send({ to: "01012345678", text: "hello" });
```

## Delivery Tracking

```ts
import {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
  InMemoryDeliveryTrackingStore,
} from "@k-msg/messaging/tracking";
import { KMsg } from "@k-msg/messaging";

const tracking = new DeliveryTrackingService({
  providers,
  store: new InMemoryDeliveryTrackingStore(),
});

const kmsg = new KMsg({
  providers,
  hooks: createDeliveryTrackingHooks(tracking),
});
```

### Bun(SQLite) 예시

```ts
import { DeliveryTrackingService } from "@k-msg/messaging/tracking";
import { SqliteDeliveryTrackingStore } from "@k-msg/messaging/adapters/bun";

const tracking = new DeliveryTrackingService({
  providers,
  store: new SqliteDeliveryTrackingStore({ dbPath: "./kmsg.sqlite" }),
});
```

### Cloudflare(D1/KV/R2/DO) 예시

```ts
import { DeliveryTrackingService } from "@k-msg/messaging/tracking";
import {
  createD1DeliveryTrackingStore,
  createKvDeliveryTrackingStore,
} from "@k-msg/messaging/adapters/cloudflare";

const d1Store = createD1DeliveryTrackingStore(env.DB);
const kvStore = createKvDeliveryTrackingStore(env.KMSG_KV);

const tracking = new DeliveryTrackingService({
  providers,
  store: d1Store, // 필요 시 kvStore / R2 / DO 스토어로 교체
});
```

### SQL 스키마 (D1/Postgres/MySQL)

`createD1DeliveryTrackingStore()`와 `HyperdriveDeliveryTrackingStore`는 동일한 논리 스키마를 사용합니다.
`DeliveryTrackingService.init()` 호출 시 테이블/인덱스가 자동 생성됩니다.

Tracking 테이블: `kmsg_delivery_tracking`

- 기본 키: `message_id`
- 주요 컬럼: `provider_id`, `provider_message_id`, `type`, `to`, `from`, `status`
- 시간 컬럼: `requested_at`, `status_updated_at`, `next_check_at`, `sent_at`, `delivered_at`, `failed_at`, `last_checked_at`, `scheduled_at`
- 부가 컬럼: `attempt_count`, `provider_status_code`, `provider_status_message`, `last_error`, `raw`, `metadata`

인덱스:

- `idx_kmsg_delivery_due(status, next_check_at)`
- `idx_kmsg_delivery_provider_msg(provider_id, provider_message_id)`
- `idx_kmsg_delivery_requested_at(requested_at)`

DB별 차이:

- D1(SQLite): JSON 계열 컬럼을 `TEXT`로 저장
- Postgres: JSON 계열 컬럼을 `JSONB`로 저장
- MySQL: 식별자 타입은 `VARCHAR`, JSON 계열 컬럼은 현재 `TEXT`로 저장

Queue 테이블 (`HyperdriveJobQueue` / `createD1JobQueue` 사용 시): `kmsg_jobs`

- 기본 키: `id`
- 주요 컬럼: `type`, `data`, `status`, `priority`, `attempts`, `max_attempts`, `delay`
- 시간 컬럼: `created_at`, `process_at`, `completed_at`, `failed_at`
- 부가 컬럼: `error`, `metadata`

Queue 인덱스:

- `idx_kmsg_jobs_dequeue(status, priority, process_at, created_at)`
- `idx_kmsg_jobs_id(id)`

