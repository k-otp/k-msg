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

상태가 바뀔 때마다 처리하려면(예: webhook 알림) `onStatusChange`를 넘깁니다. 폴링이 끝난 뒤 저장된 레코드로 호출되고, 콜백이 예외를 던져도 폴링은 계속되며 에러는 `onStatusChangeError`(없으면 `console.error`)로 전달됩니다. 전달은 최선 노력(best effort) 방식입니다. 콜백이 예외를 던진 변경은 다시 시도하지 않고, 프로세스가 멈추기 직전에 저장된 변경은 보고되지 않을 수 있으니, 하나도 놓치면 안 된다면 저장된 레코드와 대조하세요. 같은 저장소를 여러 서비스가 폴링하면 같은 변경이 두 번 이상 보고될 수도 있으니 메시지 id와 상태로 멱등하게 처리하세요. `await tracking.runOnce()`는 그 폴링의 변경이 모두 전달된 뒤에 끝나므로, 이를 기다리는 cron이나 요청 핸들러가 알림보다 먼저 끝나지 않습니다. 콜백 안에서 `runOnce()`를 다시 호출할 수도 있는데, 이때는 변경이 콜백 다음 순서로 전달되므로 대기열에 들어간 시점에 끝납니다. `@k-msg/provider`의 `MockProvider`는 보낸 메시지를 `DELIVERED`로 보고하므로(`setDeliveryStatus`로 변경) 실제 자격 증명 없이도 tracking을 돌려볼 수 있습니다.

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

// 주기적으로 폴링하거나
tracking.start();
// cron 등에서 한 번씩 실행
await tracking.runOnce();
```

`runOnce()`는 저장할 수 있는 갱신을 모두 저장합니다. 스토어가 한 레코드의 갱신을 거부하면(예: 컬럼에 들어가지 않는 값) 나머지는 그대로 저장되고, 거부된 레코드는 다음 백오프 지연 뒤에 다시 확인되며, 그 뒤 `runOnce()`가 실패 목록을 담은 `AggregateError`로 reject됩니다.

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

스토어 인스턴스는 첫 쿼리 전에 이 `CREATE ... IF NOT EXISTS` 문을 매번 실행하므로, Worker에서는 요청마다 실행됩니다. 마이그레이션으로 스키마를 만든다면(예: `buildDeliveryTrackingSchemaSql()` 출력) `initializeSchema: false`로 건너뛰세요. SQLite, Bun.SQL 스토어도 같은 옵션을 받습니다([마이그레이션으로 스키마 만들기](#마이그레이션으로-스키마-만들기) 참고).

SQL 큐(`createD1JobQueue()`, `createDrizzleJobQueue()`, `HyperdriveJobQueue`)도 같은 방식으로 `kmsg_jobs` 테이블과 인덱스를 만들며, 같은 옵션을 받습니다. 마이그레이션에서는 `buildJobQueueSchemaSql()` 출력으로 이 스키마를 만들 수 있습니다. `HyperdriveJobQueue`의 두 번째 인자로는 테이블 이름이나 `{ tableName, initializeSchema }`를 넘깁니다.

```ts
const store = createD1DeliveryTrackingStore(env.DB, {
  initializeSchema: false,
});
const queue = createD1JobQueue(env.DB, { initializeSchema: false });
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
- Postgres: JSON 계열 컬럼을 `JSONB` 문서로 저장하므로 SQL에서 읽을 수 있습니다(`last_error->>'code'`). `typeStrategy: { json: "text" }`이면 `TEXT`로 저장. `JSONB`는 NUL 문자와 짝 없는 서로게이트를 담을 수 없어 U+FFFD로 저장합니다
- MySQL: JSON 계열 컬럼을 `JSON`으로 저장(`typeStrategy: { json: "text" }`이면 `TEXT`). MySQL은 `TEXT` 컬럼에 인덱스를 만들 수 없으므로, 기본 키와 인덱스 컬럼은 `typeStrategy`와 관계없이 `VARCHAR`입니다:
  - `message_id`, `provider_id`, `provider_message_id`, 필드 암호화 시 `to_hash`와 `from_hash`: `VARCHAR(255)` (`messageId: "uuid"`이면 `message_id`는 `VARCHAR(36)`)
  - `status`, 필드 암호화 시 `retention_class`: `VARCHAR(64)`
- `provider_status_message`와 `metadata_enc`(암호화된 메타데이터)는 모든 DB에서 `TEXT`입니다. 나머지 짧은 텍스트 컬럼은 `typeStrategy.shortText`를 따릅니다(Postgres/MySQL 기본값 `VARCHAR(64)`). 단, MySQL의 인덱스 컬럼은 예외입니다

Queue 테이블 (`HyperdriveJobQueue` / `createD1JobQueue` 사용 시): `kmsg_jobs`

- 기본 키: `id`
- 주요 컬럼: `type`, `data`, `status`, `priority`, `attempts`, `max_attempts`, `delay`
- 시간 컬럼: `created_at`, `process_at`, `completed_at`, `failed_at`
- 부가 컬럼: `error`, `metadata`

Queue 인덱스:

- `idx_kmsg_jobs_dequeue(status, priority, process_at, created_at)`
- `idx_kmsg_jobs_id(id)`

SQLite와 D1은 데이터베이스 안에서, Postgres는 스키마 안에서 인덱스 이름이 겹치면 안 됩니다. 같은 곳에 두 번째 큐 테이블을 두려면 별도의 이름이 필요하며, 그렇지 않으면 `CREATE INDEX IF NOT EXISTS`가 첫 번째 테이블의 인덱스를 보고 건너뜁니다. 큐(와 `buildJobQueueSchemaSql()`)에는 `indexNames`를, `buildCloudflareSqlSchemaSql()`, `initializeCloudflareSqlSchema()`, `renderDrizzleSchemaSource()`에는 `queueIndexNames`를 넘기세요.

```ts
const otpQueue = createD1JobQueue(env.DB, {
  tableName: "otp_jobs",
  indexNames: { dequeue: "idx_otp_jobs_dequeue", id: "idx_otp_jobs_id" },
});
```

`delay`는 밀리초를 담으므로 Postgres와 MySQL에서는 `BIGINT`입니다(SQLite는 64비트인 `INTEGER`). 이전 버전은 이 컬럼을 32비트 `INTEGER`로 만들었기 때문에, 2^31ms(약 24.9일) 이상 지연된 작업은 insert가 범위 초과(out of range)로 실패해 큐에 넣을 수 없었습니다. `CREATE TABLE IF NOT EXISTS`는 이미 있는 테이블을 바꾸지 않으므로 컬럼을 직접 넓히세요:

```sql
-- Postgres
ALTER TABLE kmsg_jobs ALTER COLUMN delay TYPE BIGINT;

-- MySQL: MODIFY는 컬럼 정의를 새로 쓰므로 NOT NULL과 기본값을 유지하세요
ALTER TABLE kmsg_jobs MODIFY delay BIGINT NOT NULL DEFAULT 0;
```

strict 모드가 아닌 MySQL은 이런 지연을 대신 2147483647로 저장했습니다. `process_at`은 `BIGINT`이므로 작업은 제시간에 실행되고, 작업이 보고하는 `delay` 값만 틀립니다.

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

같은 옵션이면 Drizzle 스키마는 SQL DDL과 같은 컬럼 타입, 키, 인덱스를 선언합니다.

### 마이그레이션으로 스키마 만들기

SQL tracking 스토어가 처음 사용할 때 실행하는 `CREATE ... IF NOT EXISTS` 문은 테이블이 이미 있어도 `CREATE` 권한이 필요하므로, 최소 권한 역할에서는 `permission denied for schema public`이나 `must be owner of table`로 실패합니다. 운영 환경에서는 마이그레이션으로 테이블을 만들고 이 문장들을 끄세요:

```ts
import {
  buildDeliveryTrackingSchemaSql,
  HyperdriveDeliveryTrackingStore,
} from "@k-msg/messaging/adapters/cloudflare";

// 출력을 마이그레이션으로 커밋하세요. 스토어와 같은 옵션으로 만들어야
// 둘이 어긋나지 않습니다.
const migration = buildDeliveryTrackingSchemaSql({ dialect: "postgres" });

const store = new HyperdriveDeliveryTrackingStore(client, {
  initializeSchema: false,
});
```

`createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, `BunSqlDeliveryTrackingStore`도 같은 옵션을 받습니다. 이 옵션을 쓰면 스키마의 기준은 마이그레이션입니다.

#### 이전 버전이 만든 테이블 업그레이드

- Postgres와 MySQL에서 `provider_status_message`가 `VARCHAR(64)`였기 때문에, 더 긴 provider 메시지는 상태 갱신을 실패시켰습니다. 컬럼을 넓히세요:

  ```sql
  -- Postgres
  ALTER TABLE kmsg_delivery_tracking ALTER COLUMN provider_status_message TYPE TEXT;
  -- MySQL
  ALTER TABLE kmsg_delivery_tracking MODIFY provider_status_message TEXT;
  ```

- Postgres에서 postgres.js나 Bun.SQL로 쓴 행은 각 `JSONB` 값을 JSON 텍스트가 담긴 JSON 문자열로 저장했고, SQL JSON 연산자로는 읽을 수 없습니다.
  - `last_error`, `metadata`, `metadata_hashes`, 큐의 `metadata`는 항상 객체이므로, 스토어와 큐가 이전 문자열을 담긴 객체로 읽습니다. 이전 행을 SQL로 조회하려면 변환하세요:

    ```sql
    UPDATE kmsg_delivery_tracking
    SET last_error = (last_error #>> '{}')::jsonb
    WHERE jsonb_typeof(last_error) = 'string';

    UPDATE kmsg_delivery_tracking
    SET metadata = (metadata #>> '{}')::jsonb
    WHERE jsonb_typeof(metadata) = 'string';
    ```

    필드 암호화를 쓰면 `metadata_hashes`도 같은 방식으로 변환하세요.
  - `raw`와 큐의 `data`에는 문자열을 포함해 어떤 JSON 값이든 들어갈 수 있어 저장된 그대로 읽으므로, 이전 행의 값은 JSON 텍스트로 돌아옵니다. 이전 버전을 실행하는 프로세스를 멈춘 뒤(변환된 행을 읽지 못합니다) 이 버전을 시작하기 전에, 같은 `UPDATE`로 `raw`와 `kmsg_jobs`의 `data`, `metadata`를 한 번 변환하세요. postgres.js나 Bun.SQL이 쓴 행에만 실행하세요. 그런 행은 모두 JSON 문자열입니다. 큐는 대신 이전 버전이 작업을 모두 끝낸 뒤 올려도 됩니다.

- MySQL에서는 기본 `typeStrategy`로 SQL 스키마를 만들 수 없었으므로(오류 1170), 기존 테이블은 `typeStrategy: { messageId: "varchar", id: "varchar" }`로 만들었거나 Drizzle 스키마로 만들었습니다. 둘 다 그대로 동작합니다:
  - 그 `typeStrategy`의 SQL 스키마는 `metadata_enc`(아래)를 빼면 바뀌지 않았습니다. 계속 넘겨도 되고 빼도 됩니다. 빼면 필드 암호화를 쓰는 새 테이블에서 인덱스가 없는 컬럼이 `VARCHAR(255)` 대신 `TEXT`가 되고, 기존 테이블은 어느 쪽이든 동작합니다.
  - 이전 버전의 Drizzle 스키마는 모든 id 컬럼을 `varchar(255)`로, JSON 컬럼을 `text`로 선언했습니다. 이제 `typeStrategy`를 따르므로 drizzle-kit이 마이그레이션을 만듭니다: JSON 컬럼은 `json`이 되고, 필드 암호화 시 인덱스가 없는 컬럼(`to_enc`, `to_masked`, `from_enc`, `from_masked`, `metadata_enc`, `crypto_kid`)은 `text`가 됩니다. 저장된 값은 그대로 변환됩니다. 나머지 테이블을 그대로 두려면 `renderDrizzleSchemaSource()`와 스토어에 `typeStrategy: { id: "varchar", json: "text" }`를 넘기세요.
- `metadata_enc`는 `typeStrategy.id`를 따랐기 때문에, Postgres와 MySQL에서 `id: "varchar"`이면 `VARCHAR(255)`였고 위 두 종류의 MySQL 테이블에서도 그렇습니다. 메타데이터 암호화(`fields.metadata: "encrypt"`)를 쓰면 255자보다 긴 암호화 메타데이터가 거부됩니다(MySQL 오류 1406, Postgres `value too long`). 메타데이터 JSON이 110자 정도면 넘습니다. 이제 이 컬럼은 `typeStrategy`와 관계없이 `TEXT`입니다. 기존 테이블은 넓히세요:

  ```sql
  -- Postgres
  ALTER TABLE kmsg_delivery_tracking ALTER COLUMN metadata_enc TYPE TEXT;
  -- MySQL
  ALTER TABLE kmsg_delivery_tracking MODIFY metadata_enc TEXT;
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

### KV/R2/Durable Object 작업 큐

`createDurableObjectJobQueue`, `createKvJobQueue`, `createR2JobQueue`는 각 작업(job)을 `keyPrefix`(기본값 `kmsg/jobs`) 아래에 JSON으로 저장합니다.

- `leaseMs`를 지정하면 `dequeue()`는 반환하는 작업을 그 시간 동안 점유(lease)합니다. 지정하지 않으면 처리 도중 워커가 멈춘 작업(예: 배포)은 영원히 `processing`으로 남습니다. 점유한 작업이 제시간에 완료도 실패도 되지 않으면, 다음 `dequeue()`가 잃어버린 시도를 실패로 계산하고(`error: "LEASE_EXPIRED"`, `JOB_LEASE_EXPIRED`로 export) 작업을 다시 처리 대상으로 만들거나, 남은 시도가 없으면 실패시킨 뒤 `onLeaseExpired(job)`를 호출합니다.
  - lease 없이 이미 `processing`인 작업(예: 이전 버전이 가져간 작업)은 `dequeue()`가 처음 볼 때 lease를 받습니다.
  - lease는 연장되지 않고, 다른 워커의 처리를 막지도(fencing) 않습니다. `leaseMs`는 작업 하나가 걸릴 수 있는 가장 긴 시간보다 길게 잡으세요. lease가 끝난 뒤에도 원래 워커가 작업을 완료하거나 실패시킬 수 있고, 그 사이 다른 워커가 같은 작업을 가져갈 수 있습니다. `JobProcessor`는 자신이 이미 실행 중인 작업은 건너뜁니다.
- `nextDueAt()`은 `dequeue()`가 다음에 할 일이 생기는 시각(대기 작업의 예정 시각이나 lease 종료 시각)을 반환하므로, 폴링 대신 그 시각에 알람을 걸 수 있습니다. 과거 시각이면 lease가 끝난 작업을 실패 처리하는 일이라도 `dequeue()`에 할 일이 있다는 뜻이니, `size()`를 확인하지 말고 `dequeue()`를 호출하세요.
- `complete(jobId, result)`는 `result`(예: provider 메시지 ID)를 작업에 남깁니다. JSON으로 담을 수 없거나 storage에 비해 너무 큰 결과는 로그를 남기고 버리며, 완료 처리 자체는 실패하지 않습니다. `fail()`은 완료된 작업을 다시 열지 않습니다.
- `cleanupTerminal({ olderThan })`은 `olderThan` 이전에 끝난 작업만 지우므로, 끝난 작업을 한동안 조회할 수 있습니다.
- Durable Object에서는 작업마다 `get()`을 하지 않고 storage 목록 조회가 돌려준 값을 한 페이지씩 읽습니다. 그래도 `dequeue()`는 저장된 작업을 모두 읽으므로 끝난 작업은 주기적으로 정리하세요.

예를 들어 알람에서 발송하는 Durable Object:

```ts
import { DurableObject } from "cloudflare:workers";
import { createDurableObjectJobQueue } from "@k-msg/messaging/adapters/cloudflare";

export class SendQueue extends DurableObject<Env> {
  private readonly queue = createDurableObjectJobQueue<SendInput>(
    this.ctx.storage,
    // 발송은 10초 후 타임아웃되므로 1분이면 충분합니다.
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

    // 끝난 작업은 하루 동안 조회할 수 있게 둡니다.
    await this.queue.cleanupTerminal({
      olderThan: new Date(Date.now() - 24 * 60 * 60_000),
    });
    const next = await this.queue.nextDueAt();
    if (next) await this.ctx.storage.setAlarm(next);
  }
}
```

### Tracking 스키마 커스터마이즈

`storeRaw` 기본값은 `false`입니다. provider 원본 payload 저장이 꼭 필요할 때만 `true`로 켜세요.

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

// `client`는 Postgres용 CloudflareSqlClient입니다 (예: Hyperdrive 연결).
const store = new HyperdriveDeliveryTrackingStore(client, trackingOptions);
const ddl = buildDeliveryTrackingSchemaSql({
  dialect: "postgres",
  ...trackingOptions,
});
const spec = getDeliveryTrackingSchemaSpec(trackingOptions);
```

`typeStrategy.timestamp`는 시간 컬럼(`requested_at`, `next_check_at` 등 `*_at` 컬럼)의 타입을 정합니다:

| `timestamp` | Postgres | MySQL | SQLite / D1 |
| --- | --- | --- | --- |
| `bigint` (기본값) | `BIGINT` | `BIGINT` | `INTEGER` |
| `integer` | `BIGINT` | `BIGINT` | `INTEGER` |
| `date` | `TIMESTAMPTZ` | `BIGINT` | `INTEGER` |

스토어는 숫자 시간 컬럼에 epoch 밀리초를, `TIMESTAMPTZ` 컬럼에 `Date`를 씁니다. epoch 밀리초(현재 약 1.8 × 10¹²)에는 64비트가 필요합니다. SQLite의 `INTEGER`는 64비트이지만 Postgres와 MySQL의 `INTEGER`는 32비트이므로, `integer`는 `bigint`의 별칭입니다.

이전 버전은 Postgres와 MySQL에서 `integer`에 32비트 `INTEGER` 컬럼을 만들었고, 이 컬럼은 모든 insert를 범위 초과(out of range)로 거부합니다. `CREATE TABLE IF NOT EXISTS`는 이미 있는 테이블을 바꾸지 않으므로, 시간 컬럼을 직접 넓히세요. `tableName`과 `columnMap`을 바꿨다면 그 이름을 쓰세요:

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

-- MySQL: MODIFY는 컬럼 정의를 새로 쓰므로 원래 NOT NULL이던 컬럼은 NOT NULL을 유지하세요
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

strict 모드가 아닌 MySQL은 이 insert를 거부하지 않고 모든 시간을 2147483647로 저장했으며, 이 값은 1970-01-25로 읽힙니다. 컬럼을 넓혀도 이 값은 그대로 남습니다. 폴링은 아직 최종 상태가 아닌 이런 행을 provider에 묻지 않고 `UNKNOWN`(`TRACKING_TIMEOUT`)으로 바꿉니다. `requested_at`이 `maxTrackingDurationMs`보다 오래전으로 읽히기 때문입니다. 원래 시간은 복구할 수 없으므로, 같은 마이그레이션에서 이 행을 지우거나 직접 보관한 발송 기록으로 되살리세요:

```sql
-- strict 모드가 아닌 MySQL: 시간이 2147483647로 잘린 행
DELETE FROM kmsg_delivery_tracking WHERE requested_at = 2147483647;
```

`renderDrizzleSchemaSource()`로 만든 Drizzle 스키마를 쓰고 있다면 다시 생성하세요. 이제 `integer`에서도 시간 컬럼이 `bigint(..., { mode: "number" })`입니다.

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

