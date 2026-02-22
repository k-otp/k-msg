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

## 참고

- `@k-msg/analytics`는 자체 데이터베이스를 만들지 않습니다. `DeliveryTrackingService`가 기록한 `kmsg_delivery_tracking` 테이블을 읽습니다.
- Tracking SQL 스키마는 기본적으로 `raw` 컬럼을 만들지 않습니다(`storeRaw: false`). 필요할 때만 tracking store 옵션으로 활성화하세요.
- 운영 환경에서는 내구성 있는 저장소(`SqliteDeliveryTrackingStore` 또는 `BunSqlDeliveryTrackingStore`) 사용을 권장합니다.
- analytics 런타임 모듈의 진단 로그는 `@k-msg/core` logger를 사용합니다(`console.*` 직접 호출 제거).

## 라이선스

MIT

