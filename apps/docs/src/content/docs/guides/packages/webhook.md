---
title: "@k-msg/webhook"
description: "Generated from `packages/webhook/README_ko.md`"
---
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
  batchSize: 10,
  batchTimeoutMs: 5_000,
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
  maxRetries: 3,
  retryDelayMs: 1_000,
  timeoutMs: 30_000,
  enableSecurity: false,
  enabledEvents: [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED],
  batchSize: 10,
  batchTimeoutMs: 5_000,
};

function createRuntime(env: Env): WebhookRuntimeService {
  return new WebhookRuntimeService({
    delivery: config,
    persistence: createD1WebhookPersistence(env.DB),
    security: {
      allowPrivateHosts: true,
    },
  });
}
```

`createD1WebhookPersistence()`는 기본값으로 스키마 초기화를 자동 수행합니다.

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

## SQLite / Drizzle(Postgres) 스니펫

`WebhookRuntimeService`는 `endpointStore` + `deliveryStore` 주입을 지원합니다.
동일 인터페이스만 구현하면 백엔드를 교체할 수 있습니다.

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

## 마이그레이션 (브레이킹)

| 기존 | 변경 |
| --- | --- |
| 루트 `WebhookService` | 루트 `WebhookRuntimeService` |
| `registerEndpoint()` 시 자동 테스트 전송 | `addEndpoint()` + 필요 시 `probeEndpoint()` |
| 고급 클래스 루트 import | `@k-msg/webhook/toolkit`에서 import |
| Cloudflare persistence 수동 구성 | `@k-msg/webhook/adapters/cloudflare` 사용 |

## Toolkit subpath

```ts
import { LoadBalancer, QueueManager } from "@k-msg/webhook/toolkit";
```

## License

MIT

