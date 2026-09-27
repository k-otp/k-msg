---
title: "@k-msg/analytics"
description: "Generated from `packages/analytics/README_ko.md`"
---
`k-msg`용 분석/리포팅 패키지이며, delivery-tracking 레코드를 기반으로 동작합니다.

## 설치

```bash
npm install @k-msg/analytics k-msg @k-msg/messaging @k-msg/provider
# or
bun add @k-msg/analytics k-msg @k-msg/messaging @k-msg/provider
```

## 주요 기능

- **쿼리 기반(권장)**: `DeliveryTrackingStore` 레코드(SQLite / Bun.SQL / memory)를 읽어 KPI 계산
- **집계(Breakdown)**: 상태, provider, 메시지 타입별 분석
- **(실험적)** in-memory collector/insight/reporting 유틸리티 (변경 가능)

## 기본 사용법 (쿼리 기반)

```typescript
import { KMsg } from "k-msg";
import {
  DeliveryTrackingService,
  createDeliveryTrackingHooks,
} from "@k-msg/messaging/tracking";
import { SqliteDeliveryTrackingStore } from "@k-msg/messaging/adapters/bun";
import { DeliveryTrackingAnalyticsService } from "@k-msg/analytics";

const providers = [
  /* new SolapiProvider(...), new IWINVProvider(...), ... */
];

// 1) Tracking (store에 기록)
const store = new SqliteDeliveryTrackingStore({ dbPath: "./kmsg.sqlite" });
const tracking = new DeliveryTrackingService({ providers, store });
await tracking.init();

const kmsg = new KMsg({
  providers,
  hooks: createDeliveryTrackingHooks(tracking),
});

await kmsg.send({ to: "01012345678", text: "hello" });

// 2) Analytics (동일한 store에서 조회)
const analytics = new DeliveryTrackingAnalyticsService({ store });
const summary = await analytics.getSummary(
  { requestedAt: { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() } },
  { includeByProviderId: true, includeByType: true },
);

console.log(summary);
```

## Bun.SQL 사용 (Postgres/MySQL/SQLite)

```typescript
import { BunSqlDeliveryTrackingStore } from "@k-msg/messaging/adapters/bun";
import { DeliveryTrackingAnalyticsService } from "@k-msg/analytics";

const store = new BunSqlDeliveryTrackingStore({
  options: {
    adapter: "postgres",
    url: process.env.DATABASE_URL!,
  },
});

const analytics = new DeliveryTrackingAnalyticsService({ store });
await analytics.init();
```

## Webhook collector 서명 검증 (실험적)

`WebhookCollector`는 웹훅을 수집하기 전에 HMAC-SHA256 서명을 검사합니다.
검사는 기본으로 켜져 있습니다(`enableSignatureValidation: true`).

- `secretKey` 없이 생성하면 생성자가 예외를 던집니다. 서명 없는 웹훅을
  받으려면 `enableSignatureValidation: false`를 넘기세요.
- 서명은 `signatureHeader` 헤더(기본값 `x-signature`, 대소문자 무관)에서
  읽고, 그 헤더가 없으면 `webhook.signature`에서 읽습니다. 값은 `sha256=`
  뒤에 raw body를 `secretKey`로 계산한 HMAC-SHA256의 hex를 붙인 것입니다.
  접두사는 생략할 수 있고 hex는 대소문자를 가리지 않으며, digest는
  constant-time으로 비교합니다.
- raw body는 `webhook.rawBody`로 넘깁니다. 받은 그대로의 요청 본문을 문자열,
  `Uint8Array`, `ArrayBuffer` 중 하나로 넘겨야 하며, 없으면 거부합니다.
  `JSON.parse` 후 `JSON.stringify`를 거치면 보낸 쪽이 서명한 바이트가 거의
  재현되지 않기 때문입니다. 가능하면 바이트(`await request.arrayBuffer()`,
  Node의 raw `Buffer`)로 넘기세요. `request.text()`는 앞의 BOM을 지우고 잘못된
  UTF-8을 치환하므로 서명된 내용이 달라집니다.
- collector는 검증된 raw body(UTF-8 JSON이어야 합니다)에서 `body`를
  파싱하므로, 서명된 데이터만 변환기에 전달됩니다. `body`는 생략할 수 있고,
  함께 넘긴 값은 대체됩니다.
- `maxPayloadSize`(기본값 1MB)는 서명을 검사하기 전에 raw body의 바이트
  크기에 적용됩니다.

```ts
import { WebhookCollector } from "@k-msg/analytics";

const collector = new WebhookCollector({
  secretKey: process.env.WEBHOOK_SECRET,
  signatureHeader: "x-hub-signature-256",
});

export async function receiveWebhook(request: Request) {
  // 받은 그대로의 바이트를 넘기면 collector가 검증한 뒤 파싱합니다.
  const rawBody = await request.arrayBuffer();
  // 서명이 맞지 않으면 "Invalid webhook signature"로 reject됩니다.
  return collector.receiveWebhook({
    id: crypto.randomUUID(),
    source: "sms-provider",
    timestamp: new Date(),
    headers: Object.fromEntries(request.headers),
    rawBody,
  });
}
```

서명은 본문만 덮으므로 가로챈 요청을 그대로 다시 보내는 것은 막지 못합니다.
provider의 메시지 id처럼 본문 안에 있는 id로 중복을 걸러 내세요.

`@k-msg/webhook`이 보내는 요청은 본문만이 아니라
`<X-Webhook-Timestamp>.<raw body>`에 서명하므로 이 검사를 통과하지 못합니다.
그런 요청은 `@k-msg/webhook`으로 검증하고 `enableSignatureValidation: false`로
수집하세요.

## 참고

- `@k-msg/analytics`는 자체 데이터베이스를 만들지 않습니다. `DeliveryTrackingService`가 기록한 `kmsg_delivery_tracking` 테이블을 읽습니다.
- Tracking SQL 스키마는 기본적으로 `raw` 컬럼을 만들지 않습니다(`storeRaw: false`). 필요할 때만 tracking store 옵션으로 활성화하세요.
- 운영 환경에서는 내구성 있는 저장소(`SqliteDeliveryTrackingStore` 또는 `BunSqlDeliveryTrackingStore`) 사용을 권장합니다.
- analytics 런타임 모듈의 진단 로그는 `@k-msg/core` logger를 사용합니다(`console.*` 직접 호출 제거).

## 라이선스

MIT

