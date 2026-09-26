# @k-msg/webhook

> 공식 문서: [k-msg.and.guide](https://k-msg.and.guide)

메시지 이벤트 웹훅 전송을 위한 runtime 중심 패키지입니다.

이번 구조는 DX 기준으로 다음 3단계에 맞춰 설계되었습니다.

1. in-memory로 5분 내 시작
2. 서비스 코드 변경 없이 D1으로 전환
3. SQLite/Drizzle(Postgres) 확장

## 설치

```bash
npm install @k-msg/webhook
# 또는
bun add @k-msg/webhook
```

## Runtime API (루트)

`@k-msg/webhook` 루트는 runtime API만 제공합니다.

- `WebhookRuntimeService`
- `createInMemoryWebhookPersistence`
- `addEndpoints`, `probeEndpoint`
- `validateEndpointUrl`
- `verifyWebhookRequest` (수신 측)

고급 빌딩 블록은 subpath로 분리되었습니다.

- `@k-msg/webhook/toolkit`
- `@k-msg/webhook/adapters/cloudflare`

## 빠른 시작 (in-memory)

```ts
import {
  WebhookEventType,
  WebhookRuntimeService,
  createInMemoryWebhookPersistence,
  type WebhookConfig,
} from "@k-msg/webhook";

const config: WebhookConfig = {
  maxRetries: 3,
  retryDelayMs: 1_000,
  timeoutMs: 30_000,
  enableSecurity: false,
  enabledEvents: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_FAILED,
    WebhookEventType.SYSTEM_MAINTENANCE,
  ],
};

const runtime = new WebhookRuntimeService({
  delivery: config,
  persistence: createInMemoryWebhookPersistence(),
});

await runtime.addEndpoint({
  url: "https://example.com/webhooks/k-msg",
  active: true,
  events: [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED],
});

await runtime.emitSync({
  id: crypto.randomUUID(),
  type: WebhookEventType.MESSAGE_SENT,
  timestamp: new Date(),
  data: { messageId: "msg_123", status: "sent" },
  metadata: { providerId: "iwinv", messageId: "msg_123" },
  version: "1.0",
});

await runtime.shutdown();
```

## 이벤트 전송

- `emitSync(event)`는 조건에 맞는 모든 엔드포인트로 이벤트를 보내고, 전송이
  끝나면 delivery 목록으로 resolve됩니다.
- `emit(event)`는 이벤트를 큐에 넣습니다. 큐에 쌓인 이벤트는 최대
  `batchSize`개(기본 10)씩 함께 전송되며, 그만큼 쌓였을 때, `flush()`나
  `shutdown()`을 호출했을 때, 또는 `autoStart`(기본값)일 때 첫 이벤트가
  큐에 들어가고 `batchTimeoutMs`(기본 5000ms)가 지났을 때 전송됩니다.
  대부분의 호출은 이벤트를 큐에 넣자마자 resolve됩니다. 배치를 채운 호출은
  그 배치를 재시도까지 포함해 전송한 뒤에 resolve되지만, 다른 배치가 아직
  전송 중이면 곧바로 resolve되고 채워진 배치는 그 배치가 끝나는 즉시
  전송됩니다(그 배치가 실패하면 타이머, 다음 호출, `flush()` 중 하나가
  보냅니다). 이 타이머는 큐에 이벤트가 있을 때만 돌아갑니다. `emit()`을
  호출하지 않는 런타임은 타이머를 만들지 않고, 큐가 비면 타이머도 남지
  않습니다.

`batchSize`와 `batchTimeoutMs`는 `emit()`에만 영향을 주므로 `emitSync()`만
쓰는 설정에서는 생략해도 됩니다. `batchSize`를 `Infinity`로 두면 `flush()`나
타이머가 하나의 배치로 보낼 때까지 모든 이벤트가 큐에 남습니다.

### Cloudflare Workers 등 서버리스 런타임

await하지도 않고 `ctx.waitUntil()`에 넘기지도 않은 작업은 Worker 호출이
끝날 때 취소될 수 있고, `emit()` 타이머도 마찬가지입니다. Worker에서는
다음처럼 쓰세요.

- 요청이나 cron 실행마다 해당 바인딩으로 런타임을 만들고 `autoStart: false`를
  지정합니다(아래 D1 전환의 `createRuntime` 참고).
- `emitSync()`를 await하거나, `emit()` 뒤에
  `ctx.waitUntil(runtime.flush())`를 호출합니다.
- `timeoutMs`와 재시도가 호출이 허용하는 시간 안에 끝나게 하세요. HTTP
  응답 후 `waitUntil()` 작업에는 30초가 주어집니다.

```ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const runtime = createRuntime(env);
    await runtime.emit({
      id: crypto.randomUUID(),
      type: WebhookEventType.MESSAGE_SENT,
      timestamp: new Date(),
      data: await request.json(),
      metadata: {},
      version: "1.0",
    });
    // 호출이 끝나기 전에 큐를 전송합니다.
    ctx.waitUntil(runtime.flush());
    return new Response(null, { status: 202 });
  },
};
```

## 메시지 이벤트

메시지 이벤트는 `@k-msg/messaging` delivery tracking의 전송 상태와
대응합니다. 어떤 패키지도 이 이벤트를 자동으로 보내지 않으므로, 예를 들어
`DeliveryTrackingService`의 `onStatusChange`에서 받은 상태 변화를 해당
이벤트로 바꿔 emit하세요. provider가 메시지를 받기 전 상태인 `PENDING`에는
이벤트가 없습니다.

| 전송 상태 | 이벤트 |
| --- | --- |
| `SENT` | `message.sent` |
| `DELIVERED` | `message.delivered` |
| `FAILED` | `message.failed` |
| `CANCELLED` | `message.cancelled` |
| `UNKNOWN` | `message.unknown`: provider에 상태 조회가 없는 경우처럼 최종 결과 없이 추적이 끝남 |

`message.clicked`, `message.read`도 사용할 수 있습니다.

## D1 전환 (동일 API)

```ts
import {
  WebhookEventType,
  WebhookRuntimeService,
  type WebhookConfig,
} from "@k-msg/webhook";
import { createD1WebhookPersistence } from "@k-msg/webhook/adapters/cloudflare";

type Env = {
  DB: D1Database;
};

const config: WebhookConfig = {
  // 호출 안에서 끝날 만큼 작게 잡습니다(위 설명 참고).
  maxRetries: 2,
  retryDelayMs: 1_000,
  timeoutMs: 5_000,
  enableSecurity: false,
  enabledEvents: [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED],
};

function createRuntime(env: Env): WebhookRuntimeService {
  return new WebhookRuntimeService({
    delivery: config,
    persistence: createD1WebhookPersistence(env.DB),
    security: {
      allowPrivateHosts: true,
    },
    // Worker에서는 타이머를 쓰지 않습니다. "Cloudflare Workers 등 서버리스
    // 런타임"을 참고하세요.
    autoStart: false,
  });
}
```

`createD1WebhookPersistence()`는 기본값으로 스키마 초기화를 자동 수행합니다.

## 엔드포인트 등록

엔드포인트 id와 URL은 고유하며, 등록이 기존 엔드포인트를 대체하는 일은
없습니다. `addEndpoint()`는 이미 등록된 id나 URL을
`WebhookEndpointConflictError`로 거절합니다. 이 에러의 `field`는 `"id"` 또는
`"url"`이고, `endpointId`는 이미 등록된 엔드포인트의 id입니다.
`updateEndpoint()`도 다른 엔드포인트가 쓰는 URL을 같은 방식으로 거절합니다.
엔드포인트의 secret, 이벤트, URL은 `updateEndpoint()`로 바꾸세요.
`addEndpoints()`는 엔드포인트를 모두 저장하거나 하나도 저장하지 않습니다.
먼저 저장된 엔드포인트와 비교하고, 이후 쓰기가 실패하면 이미 추가한 것을
제거합니다. 한 번의 호출에 같은 id나 URL을 두 번 넣으면 충돌이 아니라 잘못된
입력이므로 일반 `Error`를 던집니다.

배포할 때마다 같은 엔드포인트를 등록하려면 이미 있는 엔드포인트를
갱신하세요.

```ts
import { WebhookEndpointConflictError, WebhookEventType } from "@k-msg/webhook";

const input = {
  url: "https://example.com/webhooks/k-msg",
  active: true,
  events: [WebhookEventType.MESSAGE_SENT],
};

try {
  await runtime.addEndpoint(input);
} catch (error) {
  if (!(error instanceof WebhookEndpointConflictError)) throw error;
  // 사용자가 등록을 요청한 경우라면 409 Conflict로 응답해도 됩니다.
  await runtime.updateEndpoint(error.endpointId, input);
}
```

URL은 저장된 문자열 그대로 비교합니다. 대문자 호스트나 명시적인 `:443`처럼
같은 주소가 다른 표기로 들어올 수 있다면 `new URL(url).href`로 등록하세요.

## Cloudflare 스키마 헬퍼

```ts
import {
  buildWebhookSchemaSql,
  initializeWebhookSchema,
} from "@k-msg/webhook/adapters/cloudflare";

const statements = buildWebhookSchemaSql();
// 마이그레이션 시스템에서 실행하거나:
await initializeWebhookSchema(env.DB);
```

D1에서 한 URL에 엔드포인트가 둘 저장되지 않게 막는 것은 엔드포인트
테이블 `url` 컬럼의 unique index입니다. 마이그레이션을 직접 작성한다면 이
index를 유지하세요.

## SQLite / Drizzle(Postgres) 스니펫

`WebhookRuntimeService`는 `endpointStore` + `deliveryStore` 주입을 지원합니다.
동일 인터페이스만 구현하면 백엔드를 교체할 수 있습니다. 엔드포인트 store의
`add()`는 이미 저장된 id나 URL을, `update()`는 다른 엔드포인트가 쓰는 URL을
`WebhookEndpointConflictError`로 거절해야 합니다. URL 컬럼의 unique index가
대부분을 처리해 줍니다.

```ts
import type {
  WebhookDeliveryStore,
  WebhookEndpointStore,
} from "@k-msg/webhook";

class SqliteEndpointStore implements WebhookEndpointStore {
  async add() {}
  async update() {}
  async remove() {}
  async get() {
    return null;
  }
  async list() {
    return [];
  }
}

class SqliteDeliveryStore implements WebhookDeliveryStore {
  async add() {}
  async list() {
    return [];
  }
}
```

런타임 연결 코드는 동일합니다.

```ts
const runtime = new WebhookRuntimeService({
  delivery: config,
  endpointStore: new SqliteEndpointStore(),
  deliveryStore: new SqliteDeliveryStore(),
});
```

## 보안 기본값

- 기본적으로 private host 차단
- `http://localhost` 류 URL은 옵션으로 명시 허용해야 사용 가능

## 전송 서명과 검증

`enableSecurity: true`이면 모든 전송에 HMAC 서명을 붙입니다. 엔드포인트의
`secret`으로 서명하고, 엔드포인트에 secret이 없으면 delivery 설정의
`secretKey`를 씁니다. `enableSecurity`가 켜져 있는 동안 서명 없이 보내는
일은 없습니다.

- `addEndpoint()`와 `updateEndpoint()`는 secret이 없게 되는 활성 엔드포인트에
  대해 예외를 던집니다. 비활성 엔드포인트에는 secret이 필요 없으므로, secret
  없는 엔드포인트는 삭제하는 대신 `updateEndpoint(id, { active: false })`로
  멈춰 둘 수 있습니다.
- 보안을 켜기 전에 저장된 엔드포인트처럼 secret 없이 저장된 활성
  엔드포인트에는 요청을 보내지 않고 `failed` 전송을 기록합니다. 유일한
  attempt에는 `httpStatus`가 없고 `error`에 이유가 담기며,
  `probeEndpoint()`도 같은 `error`를 돌려줍니다.
- `fieldCrypto.endpoint`가 fail-open(`failMode: "open"`)일 때 저장된 secret을
  복호화하지 못한 엔드포인트는 마스킹 값, 빈 값, 암호문 대신 `secret` 없이
  `secretUndecryptable: true`(JSON을 거쳐도 남습니다)와 함께 반환되고,
  `secretKey`가 있어도 같은 방식으로 전송이 실패합니다. 그 수신
  측은 자기 secret으로 검증하기 때문입니다. `openFallback: "plaintext"`도
  마찬가지입니다. 복호화되지 않는 값은 암호문과 구별할 수 없으므로, 이
  fallback이 평문으로 저장한 secret도 다시 지정하기 전까지 쓰지 않습니다.
  `secret`을 지정하지 않은 업데이트는 저장된 secret을 그대로 두고, 지정한
  `secret`을 암호화하지도 저장된 값과 비교하지도 못하면 추측하지 않고
  실패합니다.

secret은 field crypto 사용 여부와 관계없이 앞뒤 공백까지 주어진 그대로
씁니다.

자체 secret이 없는 엔드포인트들은 `secretKey`를 함께 쓰므로, 그 값을 가진
쪽은 이 엔드포인트 모두에 보낼 요청을 서명할 수 있습니다. 수신 측이 서로
다른 주체라면 엔드포인트마다 `secret`을 따로 두세요.

모든 요청에는 다음 헤더가 붙습니다.

| 헤더 | 값 |
| --- | --- |
| `X-Webhook-ID` | 이벤트 id |
| `X-Webhook-Event` | 이벤트 타입 |
| `X-Webhook-Timestamp` | 해당 attempt를 보낸 시각의 Unix time(초) |
| `X-Webhook-Signature` | `sha256=` 뒤에 `<X-Webhook-Timestamp>.<원본 body>`의 HMAC-SHA256 hex. `enableSecurity`일 때만 |

엔드포인트에 지정한 `headers`도 함께 보내지만 위 헤더를 덮어쓰지는
못합니다. 서명 대상은 원본 body와 `X-Webhook-Timestamp`뿐이고
`X-Webhook-ID`와 `X-Webhook-Event`는 서명되지 않으므로, 중복 제거와
라우팅에는 body의 `id`와 `type`을 쓰세요.

timestamp는 이벤트의 `timestamp`가 아니라 각 attempt를 보낸 시각이고,
재시도할 때마다 다시 서명합니다. 그래서 오래된 timestamp를 거절하는 수신
측도 재시도나 큐에서 기다린 이벤트는 받아들입니다. delivery 설정의
`signatureHeader`, `signaturePrefix`, `algorithm`(`sha256` 또는 `sha1`)으로
서명 헤더, 접두사, 해시를 바꿀 수 있습니다. 접두사 기본값은 알고리즘과
관계없이 `sha256=`이며, 빈 문자열을 지정해도 기본값이 쓰입니다.

수신 측은 `verifyWebhookRequest`로 요청을 검증합니다. 서명을 constant-time으로
비교한 뒤, 수신 측 시계와 `toleranceMs`(기본 5분) 넘게 차이 나는 timestamp를
거절합니다. timestamp의 해상도는 1초라서 `toleranceMs`보다 최대 1초 더 오래된
요청도 통과할 수 있습니다.

```ts
import { verifyWebhookRequest } from "@k-msg/webhook";

export async function receiveWebhook(
  request: Request,
  secret: string,
): Promise<Response> {
  // 받은 바이트 그대로 검증합니다. request.text()는 앞의 BOM을 지우고 잘못된
  // 바이트를 바꾸며, JSON 변환도 body를 바꿀 수 있습니다.
  const body = await request.arrayBuffer();
  const verified = verifyWebhookRequest(request.headers, body, secret, {
    toleranceMs: 5 * 60 * 1000,
  });
  if (verified.isFailure) {
    // MISSING_SIGNATURE, MISSING_TIMESTAMP, INVALID_SIGNATURE,
    // INVALID_TIMESTAMP, STALE_TIMESTAMP
    return new Response(verified.error.code, { status: 401 });
  }

  const event = JSON.parse(new TextDecoder().decode(body));
  // 전송은 at-least-once입니다. 이미 처리한 이벤트 id는 건너뛰세요.
  console.log("webhook received", event.id);
  return new Response(null, { status: 204 });
}
```

Node 스타일 헤더 레코드(`req.headers`)와 `express.raw()`의 `Buffer` 같은
`Uint8Array` body도 받습니다. 문자열 body는 주어진 그대로 검증합니다. 송신
측에서 `algorithm`, `signatureHeader`, `signaturePrefix`를 바꿨다면 옵션에 같은
값을 넘기세요.

## 마이그레이션 (브레이킹)

| 기존 | 변경 |
| --- | --- |
| 루트 `WebhookService` | 루트 `WebhookRuntimeService` |
| `registerEndpoint()` 시 자동 테스트 전송 | `addEndpoint()` + 필요 시 `probeEndpoint()` |
| 고급 클래스 루트 import | `@k-msg/webhook/toolkit`에서 import |
| Cloudflare persistence 수동 구성 | `@k-msg/webhook/adapters/cloudflare` 사용 |
| `fields.secret` / `fields.payload` 없이, 또는 `plain`/`mask`로 설정한 `fieldCrypto.endpoint` / `fieldCrypto.delivery` | `fields.secret`(endpoint)과 `fields.payload`(delivery)를 `encrypt` 또는 `encrypt+hash`로 설정. 그 외 값은 이제 시작 시 실패 |
| `fieldCrypto.tenantId`를 설정한 상태로 저장한 암호문 | 이제 tenant에도 바인딩됨. 이전에 저장된 값은 `fieldCrypto.acceptLegacyAad`를 켜지 않으면 거부됨. 플래그를 켠 채 배포하고, 모든 인스턴스가 새 버전으로 바뀐 뒤 `runtime.migrateFieldCryptoToTenant()`를 한 번 실행해 재암호화한 다음(이전 버전 인스턴스는 tenant 없는 값을 계속 쓰므로, 다시 실행하면 그 값도 옮겨짐) 플래그를 제거. 실행하는 동안 다른 인스턴스의 엔드포인트 변경은 멈출 것. 커스텀 delivery store는 `replace()`와 `list()`의 `before` 커서를 지원해야 함 |
| `@k-msg/webhook/toolkit`의 `BatchDispatcher` / `BatchConfig` | 제거됨. 실제 요청을 보낸 적이 없음. `runtime.emit()` / `flush()`를 쓰거나, 단건 전송은 `WebhookDispatcher.dispatch()` 사용 ([Toolkit subpath](#toolkit-subpath) 참고) |

## Toolkit subpath

```ts
import { LoadBalancer, QueueManager } from "@k-msg/webhook/toolkit";
```

`BatchDispatcher`는 더 이상 export되지 않습니다. 이 클래스는 HTTP 요청을 보내지 않고 작업마다 결과를 시뮬레이션했기 때문에(무작위 200 또는 500, 임의의 지연 시간), 실제로 일어나지 않은 전송 결과를 보고했습니다. 배치 전송이 필요하면 runtime 큐를 사용하세요. `emit()`은 이벤트를 큐에 넣고, runtime은 큐의 이벤트를 `batchTimeoutMs`마다 또는 배치가 차는 즉시 `batchSize`개씩 `WebhookDispatcher`로 전송한 뒤 각 결과를 기록합니다.

```ts
await runtime.emit(event);
await runtime.flush(); // 아직 큐에 남은 이벤트를 전송 (shutdown()도 동일)
const deliveries = await runtime.listDeliveries({ endpointId });
```

runtime 밖에서 관리하는 엔드포인트라면 `new WebhookDispatcher(config, httpClient).dispatch(event, endpoint)`로 한 건을 전송하고, 상태가 담긴 delivery를 돌려받습니다. 이 메서드는 URL을 검사하지 않으므로 엔드포인트 URL은 먼저 `validateEndpointUrl()`로 확인하세요.

## License

MIT
