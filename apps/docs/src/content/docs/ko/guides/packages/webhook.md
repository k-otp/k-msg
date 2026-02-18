---
title: "@k-msg/webhook"
description: "Generated from `packages/webhook/README_ko.md`"
---
HTTP 엔드포인트로 실시간 메시지 이벤트를 전달하기 위한 웹훅(Webhook) 전송 도구입니다.

이 패키지는 아래 기능을 제공합니다.
- `WebhookService`: 편의용 Facade (in-memory 엔드포인트 레지스트리 + 배치 처리)
- `WebhookDispatcher`: HTTP 전송 + 재시도(백오프)
- `SecurityManager`: HMAC 서명 생성/검증
- Zod 스키마: `WebhookEventSchema`, `WebhookEndpointSchema`, `WebhookDeliverySchema`

참고:
- 기본 `WebhookService` 저장소는 in-memory입니다. 영속 저장/고급 워크플로우가 필요하면 `EndpointManager`, `DeliveryStore` 같은 빌딩 블록을 활용하세요.
- 이 패키지는 런타임 중립(Edge/Web/Node)으로 동작하며, 기본적으로 Node 내장 모듈에 의존하지 않습니다.

## 설치

```bash
npm install @k-msg/webhook
# 또는
bun add @k-msg/webhook
```

## 빠른 시작 (WebhookService)

```ts
import { readRuntimeEnv } from "@k-msg/core";
import {
  WebhookEventType,
  WebhookService,
  type WebhookConfig,
} from "@k-msg/webhook";

const config: WebhookConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  // Optional: maxDelayMs, backoffMultiplier, jitter
  timeoutMs: 30_000,
  enableSecurity: true,
  // Optional: 엔드포인트에 secret이 없을 때 fallback으로 사용됩니다.
  secretKey: readRuntimeEnv("WEBHOOK_SECRET"),
  // Optional: algorithm, signatureHeader, signaturePrefix
  enabledEvents: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_DELIVERED,
    WebhookEventType.MESSAGE_FAILED,
  ],
  batchSize: 10,
  batchTimeoutMs: 5_000,
};

const service = new WebhookService(config);

const endpoint = await service.registerEndpoint({
  url: "https://example.com/webhooks/k-msg",
  active: true,
  events: [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED],
  // Optional: 엔드포인트별 secret (config.secretKey보다 우선)
  secret: readRuntimeEnv("WEBHOOK_SECRET"),
  // Optional: 엔드포인트별 재시도 설정
  retryConfig: { maxRetries: 5, retryDelayMs: 1000, backoffMultiplier: 2 },
  // Optional: 메타데이터 기반 필터
  filters: { providerId: ["iwinv", "solapi"] },
});

// 비동기 emit (배치 처리됨)
await service.emit({
  id: crypto.randomUUID(),
  type: WebhookEventType.MESSAGE_SENT,
  timestamp: new Date(),
  data: { messageId: "msg_123", status: "sent" },
  metadata: { providerId: "iwinv", messageId: "msg_123" },
  version: "1.0",
});

// 동기 emit (딜리버리 결과를 반환)
const deliveries = await service.emitSync({
  id: crypto.randomUUID(),
  type: WebhookEventType.MESSAGE_FAILED,
  timestamp: new Date(),
  data: { messageId: "msg_456", status: "failed" },
  metadata: { providerId: "solapi", messageId: "msg_456" },
  version: "1.0",
});

// 최근 딜리버리 조회(in-memory)
const recent = await service.getDeliveries(endpoint.id);
console.log(deliveries.length, recent.length);

await service.shutdown();
```

### 엔드포인트 등록 동작

`registerEndpoint()`는 URL 유효성 검증 후, `testEndpoint()`를 통해 테스트 웹훅(`system.maintenance`)을 1회 전송합니다.

## 보안 (HMAC 서명)

보안이 활성화되어 있고 secret이 존재하면(`endpoint.secret` 또는 `config.secretKey`), 아래 헤더가 포함됩니다.
- `X-Webhook-Timestamp`: unix epoch seconds (string)
- `X-Webhook-Signature`: HMAC 서명 (기본: `sha256=<hex>`)

서명 입력 문자열은 아래 형식입니다.

```
${timestamp}.${rawBody}
```

수신 측에서는 반드시 "raw body 문자열" 그대로 검증해야 합니다.

### Hono 예시

```ts
import { Hono } from "hono";
import { readRuntimeEnv } from "@k-msg/core";
import { SecurityManager } from "@k-msg/webhook";

const app = new Hono();
const security = new SecurityManager({
  algorithm: "sha256",
  signatureHeader: "X-Webhook-Signature",
  signaturePrefix: "sha256=",
});

app.post("/webhooks/k-msg", async (c) => {
  const payload = await c.req.text();

  const signature = c.req.header("X-Webhook-Signature") ?? "";
  const timestamp = c.req.header("X-Webhook-Timestamp") ?? "";
  const secret = readRuntimeEnv("WEBHOOK_SECRET") ?? "";

  if (!security.verifyTimestamp(timestamp, 300)) {
    return c.json({ error: "Request too old" }, 401);
  }
  if (!security.verifySignatureWithTimestamp(payload, timestamp, signature, secret)) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const event = JSON.parse(payload);
  return c.json({ ok: true, type: event.type });
});
```

## 재시도 및 상태

`WebhookDispatcher`는 실패한 전송을 지수 백오프로 재시도합니다.

딜리버리 상태:
- `success`: 2xx 응답을 받음
- `failed`: 재시도 대상이 아닌 실패(주로 non-retryable 4xx)
- `exhausted`: 재시도 가능한 실패였지만, 재시도 횟수 소진

## 필터링

엔드포인트는 이벤트 메타데이터 기반으로 전달을 필터링할 수 있습니다.

```ts
await service.registerEndpoint({
  url: "https://example.com/webhooks/k-msg",
  active: true,
  events: [WebhookEventType.MESSAGE_SENT],
  filters: {
    providerId: ["iwinv"],
    channelId: ["marketing"],
    templateId: ["welcome-template"],
  },
});
```

## File Storage Adapter (`type: "file"` 사용 시)

`EndpointManager`, `EventStore`, `DeliveryStore`, `QueueManager`는 Node `fs/path`를 직접 import하지 않습니다.
파일 영속화를 사용하려면 `fileAdapter`를 주입해야 합니다.

```ts
import { DeliveryStore, type FileStorageAdapter } from "@k-msg/webhook";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const nodeFileAdapter: FileStorageAdapter = {
  appendFile: (filePath, data) => fs.appendFile(filePath, data, "utf8"),
  readFile: (filePath) => fs.readFile(filePath, "utf8"),
  writeFile: (filePath, data) => fs.writeFile(filePath, data, "utf8"),
  ensureDirForFile: (filePath) =>
    fs.mkdir(path.dirname(filePath), { recursive: true }),
};

const store = new DeliveryStore({
  type: "file",
  filePath: "./data/deliveries.log",
  fileAdapter: nodeFileAdapter,
});
```

## Zod 스키마

이 패키지는 검증용 Zod 스키마를 export 합니다.
- `WebhookEventSchema` (timestamp는 string/number 입력을 `Date`로 coerce)
- `WebhookEndpointSchema`
- `WebhookDeliverySchema`

## License

MIT

