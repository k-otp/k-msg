# @k-msg/messaging

> 공식 문서: [k-msg.and.guide](https://k-msg.and.guide)

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
  - Drizzle 래핑 SQL client/store 팩토리
  - SQL/Drizzle 스키마 생성 유틸
  - KV/R2/DO 기반 object storage 어댑터

## 마이그레이션 (Breaking)

- 루트(`@k-msg/messaging`)에서 제거된 심볼:
  - `BunSqlDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, `SQLiteJobQueue`
  - `JobProcessor`, `MessageJobProcessor`, `MessageRetryHandler`
  - `createDeliveryTrackingHooks`, `DeliveryTrackingService`, `InMemoryDeliveryTrackingStore`
  - `BulkMessageSender`
  - `Job`, `JobQueue`, `JobStatus`
  - `VariableReplacer`, `VariableUtils`, `defaultVariableReplacer`
- 대체 경로:
  - Bun 관련: `@k-msg/messaging/adapters/bun`
  - Node 관련: `@k-msg/messaging/adapters/node`
  - Tracking 관련: `@k-msg/messaging/tracking`
  - Sender 관련: `@k-msg/messaging/sender`
  - Queue 관련: `@k-msg/messaging/queue`
  - 템플릿 개인화 관련: `@k-msg/template` (`TemplatePersonalizer`, `TemplateVariableUtils`, `defaultTemplatePersonalizer`)
- `JobProcessor`/`MessageJobProcessor`는 이제 `jobQueue`를 반드시 주입해야 합니다.

- `MessageRetryHandler`는 provider 기능 공백을 메우는 애플리케이션 레벨 retry orchestrator입니다. 실제 재전송은 호출자가 `execute(attempt, item)` 콜백으로 주입해야 하며, 핸들러는 retry 타이밍과 정책, 큐 상태만 관리합니다.

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

### SMS와 LMS

`type`을 생략하면 `KMsg`는 `defaults.sms.autoLmsBytes`(기본 90바이트)보다 긴 텍스트를 LMS로 보냅니다. ASCII 문자는 1바이트, 한글 등 그 밖의 문자는 2바이트로 셉니다. `estimateSmsBytes()`도 같은 방식으로 세므로, 보내기 전에 입력을 검사할 때 쓸 수 있습니다:

```ts
import { estimateSmsBytes } from "@k-msg/messaging";

if (estimateSmsBytes(text) > 2_000) {
  // 일반적인 LMS 한도보다 깁니다.
}
```

## 라우팅

`routing.byType`으로 메시지 타입별 provider를 정할 수 있습니다. provider 자격 증명 없이 라우팅을 시험하려면 `MockProvider`마다 다른 id를 주세요:

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

설정 객체를 생성자 밖에서 만들 때는 내보낸 `KMsgConfig`, `KMsgRoutingConfig`, `KMsgDefaultsConfig`, `RoutingStrategy` 타입을 쓸 수 있습니다.

## 대량 발송

배열을 넘기면 provider별로 묶어 최대 50건(provider의 배치 한도가 더 작으면 그 값) 단위로 보내고, 메시지마다 `Result`를 돌려줍니다.

## 타임아웃과 취소

`send()`와 `sendOrThrow()`의 두 번째 인자는 해당 호출에서 provider로 그대로 전달됩니다. `AbortSignal`과, 필요하면 `fetch` 구현을 넘길 수 있고, 배치는 이를 함께 씁니다.

```ts
const result = await kmsg.send(
  { to: "01012345678", text: "hello" },
  { signal: AbortSignal.timeout(5_000) },
);
```

provider가 지원하는 항목은 `provider.transportCapabilities`(`abortSignal`, `injectableFetch`)에 선언되어 있고, 지원하지 않는 항목은 무시됩니다.

## ALIMTALK 대체 문자

`failover.fallbackContent`와 `failover.fallbackTitle`에도 SMS 텍스트처럼 `#{변수}`를 쓸 수 있고, 메시지의 `variables`로 채워집니다. `fallbackChannel`을 생략하면 `KMsg`가 채워진 텍스트 길이로 정합니다: `defaults.sms.autoLmsBytes`보다 길면 `lms`, 아니면 `sms`. tracking 기반 API 대체 발송도 이 채널을 따르고, 채널이 없는 레코드(`KMsg`를 거치지 않은 발송)는 90바이트를 넘으면 LMS로 보냅니다.

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "ORDER_SHIPPED",
  variables: { name: "김철수", orderId: "A-1024" },
  failover: {
    enabled: true,
    fallbackTitle: "배송 시작",
    // 알림톡이 실패하면 "김철수님, 주문번호 A-1024 상품이 발송되었습니다."로 보냅니다.
    fallbackContent: "#{name}님, 주문번호 #{orderId} 상품이 발송되었습니다.",
  },
});
```

## Delivery Tracking

상태가 바뀔 때마다 처리하려면(예: webhook 알림) `onStatusChange`를 넘깁니다. 저장된 변경마다 한 번 호출되고, 콜백이 예외를 던져도 폴링은 계속되며 에러는 `onStatusChangeError`(없으면 `console.error`)로 전달됩니다. `@k-msg/provider`의 `MockProvider`는 보낸 메시지를 `DELIVERED`로 보고하므로(`setDeliveryStatus`로 변경) 실제 자격 증명 없이도 tracking을 돌려볼 수 있습니다.

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

스토어 인스턴스는 첫 쿼리 전에 이 `CREATE ... IF NOT EXISTS` 문을 매번 실행하므로, Worker에서는 요청마다 실행됩니다. 마이그레이션으로 스키마를 만든다면(예: `buildDeliveryTrackingSchemaSql()` 출력) `initializeSchema: false`로 건너뛰세요. SQLite, Bun.SQL 스토어도 같은 옵션을 받습니다.

```ts
const store = createD1DeliveryTrackingStore(env.DB, {
  initializeSchema: false,
});
```

Tracking 테이블/인덱스 기본값은 어댑터 스키마 스펙에서 생성됩니다:

<!-- tracking-schema-summary:start -->
- Tracking 테이블 기본값: `kmsg_delivery_tracking` (`tableName`으로 override 가능)
- 기본 키: `message_id`
- 주요 컬럼: `provider_id`, `provider_message_id`, `type`, `to`, `from`, `status`
- 시간 컬럼: `requested_at`, `status_updated_at`, `next_check_at`, `sent_at`, `delivered_at`, `failed_at`, `last_checked_at`, `scheduled_at`
- 부가 컬럼: `attempt_count`, `provider_status_code`, `provider_status_message`, `last_error`, `metadata`
- `raw` 컬럼은 기본 비활성(`storeRaw: false`)이며, 필요 시 `storeRaw: true`로 활성화됩니다.
- 인덱스: `idx_kmsg_delivery_due(status, next_check_at)`
- 인덱스: `idx_kmsg_delivery_provider_msg(provider_id, provider_message_id)`
- 인덱스: `idx_kmsg_delivery_requested_at(requested_at)`
<!-- tracking-schema-summary:end -->

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

### Cloudflare 스키마 유틸 API

```ts
import {
  buildCloudflareSqlSchemaSql,
  buildDeliveryTrackingSchemaSql,
  buildJobQueueSchemaSql,
  initializeCloudflareSqlSchema,
  renderDrizzleSchemaSource,
} from "@k-msg/messaging/adapters/cloudflare";

// SQL DDL 문자열 생성
const ddl = buildCloudflareSqlSchemaSql({
  dialect: "postgres",
  target: "both",
});

// 런타임 스키마 초기화 (duplicate/exists 계열만 무시)
await initializeCloudflareSqlSchema(client, { target: "both" });

// Drizzle 스키마 TypeScript 소스 생성
const drizzleSource = renderDrizzleSchemaSource({
  dialect: "postgres",
  target: "both",
});
```

### Drizzle 어댑터 팩토리

```ts
import {
  createDrizzleDeliveryTrackingStore,
  createDrizzleJobQueue,
} from "@k-msg/messaging/adapters/cloudflare";

const trackingStore = createDrizzleDeliveryTrackingStore({
  dialect: "postgres",
  db, // execute()/transaction()를 제공하는 drizzle db
});

const queue = createDrizzleJobQueue({
  dialect: "postgres",
  db,
});
```

### Tracking 스키마 커스터마이즈

`storeRaw` 기본값은 `false`입니다. provider 원본 payload 저장이 꼭 필요할 때만 `true`로 켜세요.

```ts
import {
  buildDeliveryTrackingSchemaSql,
  createD1DeliveryTrackingStore,
  getDeliveryTrackingSchemaSpec,
} from "@k-msg/messaging/adapters/cloudflare";

const trackingOptions = {
  tableName: "otp_delivery_tracking",
  columnMap: {
    messageId: "id",
    nextCheckAt: "next_check_at_ms",
  },
  typeStrategy: {
    messageId: "uuid",
    timestamp: "integer",
  },
  storeRaw: true,
} as const;

const store = createD1DeliveryTrackingStore(env.DB, trackingOptions);
const ddl = buildDeliveryTrackingSchemaSql({
  dialect: "postgres",
  ...trackingOptions,
});
const spec = getDeliveryTrackingSchemaSpec(trackingOptions);
```

### Drizzle 지원 버전

| `@k-msg/messaging` | 지원 `drizzle-orm` |
| --- | --- |
| `0.19.x` | `^0.44.0 || ^0.45.0 || >=1.0.0-beta <1.0.0` |

이 라인의 호환성은 CI `drizzle-compat` 매트릭스로 검증합니다:

<!-- drizzle-compat-matrix:start -->
- `drizzle-orm@0.44.7`
- `drizzle-orm@0.45.2`
- `drizzle-orm@beta`
<!-- drizzle-compat-matrix:end -->
