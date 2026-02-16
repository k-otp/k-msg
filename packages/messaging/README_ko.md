# @k-msg/messaging

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
- 대체 경로:
  - Bun 관련: `@k-msg/messaging/adapters/bun`
  - Node 관련: `@k-msg/messaging/adapters/node`
- `JobProcessor`/`MessageJobProcessor`는 이제 `jobQueue`를 반드시 주입해야 합니다.

## 기본 사용

```ts
import { KMsg } from "@k-msg/messaging";
import { SolapiProvider } from "@k-msg/provider";

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
  KMsg,
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
  InMemoryDeliveryTrackingStore,
} from "@k-msg/messaging";

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
import { DeliveryTrackingService } from "@k-msg/messaging";
import { SqliteDeliveryTrackingStore } from "@k-msg/messaging/adapters/bun";

const tracking = new DeliveryTrackingService({
  providers,
  store: new SqliteDeliveryTrackingStore({ dbPath: "./kmsg.sqlite" }),
});
```

### Cloudflare(D1/KV/R2/DO) 예시

```ts
import { DeliveryTrackingService } from "@k-msg/messaging";
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
