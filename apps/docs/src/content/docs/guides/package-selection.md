---
title: 패키지 선택 가이드
description: 프로젝트에 필요한 @k-msg 패키지를 선택하는 방법을 안내합니다.
---

K-Message는 모놀리식 단일 패키지가 아니라, 사용 목적에 따라 필요한 패키지만 선택해서 설치할 수 있는 모듈형 구조입니다. 이 가이드에서는 각 패키지의 역할과 어떤 상황에 어떤 패키지가 필요한지 설명합니다.

## 패키지 개요

### k-msg

**통합 Facade 패키지**

대부분의 사용자가 시작하는 진입점입니다. `KMsg` 클래스를 통해 메시지 전송, 라우팅, 기본 설정을 하나의 인터페이스로 제공합니다.

- `KMsg` 클래스 (메시지 전송 facade)
- 런타임 어댑터 서브패스 (`/adapters/bun`, `/adapters/node`, `/adapters/cloudflare`)
- `@k-msg/core`의 주요 타입 재노출

번들 크기에 민감하고 core 유틸만 필요한 경우에는 루트(`k-msg`) 대신 `k-msg/core`(또는 `@k-msg/core`) import를 권장합니다.

```ts
import { parseErrorRetryPolicyFromJson } from "k-msg/core";
```

### @k-msg/core

**핵심 타입과 유틸리티**

모든 패키지의 기반이 되는 저수준 패키지입니다. Provider를 직접 구현하거나 고급 에러 처리가 필요할 때 사용합니다.

- 메시지 타입: `MessageType`, `SendInput`, `SendOptions`, `SendResult`
- Provider 인터페이스: `Provider`, `BalanceProvider`
- Result 패턴: `Result<T, E>`, `ok()`, `fail()`
- 에러: `KMsgError`, `KMsgErrorCode`
- 복원력 유틸리티: 재시도, 서킷 브레이커, 속도 제한

### @k-msg/messaging

**메시징 코어**

`KMsg` 클래스의 실제 구현이 포함된 패키지입니다. 메시지 정규화, 라우팅, 전송 큐, 배달 추적 기능을 제공합니다.

- `KMsg` 클래스 구현
- 전송 큐 및 배치 처리
- 배달 추적 서비스 (`/tracking` 서브패스)
- 런타임별 어댑터 (`/adapters/bun`, `/adapters/node`, `/adapters/cloudflare`)

### @k-msg/provider

**Provider 구현체**

SOLAPI, IWINV, Aligo 등 실제 메시징 프로바이더 구현을 제공합니다.

- `SolapiProvider` (SOLAPI)
- `IWINVProvider` (IWINV 알림톡 + SMS)
- `AligoProvider` (Aligo)
- `MockProvider` (테스트용)
- Provider 온보딩 스펙 레지스트리

### @k-msg/template

**템플릿 엔진**

알림톡 템플릿의 파싱, 검증, 변수 치환을 담당합니다.

- `interpolate()` - `#{변수명}` 문법의 변수 치환
- `TemplatePersonalizer` - 개인화 처리
- `TemplateLifecycleService` - 템플릿 생명주기 관리
- 툴킷 (`/toolkit`): 빌더, 레지스트리, 인메모리 스토어

### @k-msg/analytics

**통계 및 분석**

메시지 전송 통계를 집계하고 분석 리포트를 생성합니다.

- `DeliveryTrackingAnalyticsService` - 배달 추적 기반 통계
- 상태별, 프로바이더별, 메시지 타입별 분석
- `DeliveryTrackingStore`와 연동

### @k-msg/webhook

**웹훅 처리**

메시지 이벤트를 실시간으로 외부 시스템에 전달합니다.

- `WebhookRuntimeService` - 웹훅 런타임
- 엔드포인트 등록/관리
- 이벤트 배달 및 재시도
- D1 어댑터 (`/adapters/cloudflare`)

### @k-msg/channel

**채널 및 발신번호 관리**

카카오 채널과 발신번호의 생명주기를 관리합니다.

- `KakaoChannelLifecycleService` - 채널 생명주기
- `KakaoChannelBindingResolver` - 설정 바인딩 해석
- 채널 온보딩 (API 지원 프로바이더)
- 툴킷 (`/toolkit`): 인메모리 관리자

## 의사결정 트리

사용 목적에 따라 필요한 패키지를 선택하세요.

### 메시지만 보내면 됨

```
k-msg + @k-msg/provider
```

가장 일반적인 조합입니다. `KMsg`로 메시지를 보내고, 원하는 Provider를 선택합니다.

```bash
bun add k-msg @k-msg/provider
```

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [new IWINVProvider({ apiKey: process.env.IWINV_API_KEY! })],
});

await kmsg.send({ to: "01012345678", text: "안녕하세요!" });
```

### Provider 직접 구현

```
@k-msg/core
```

자체 메시징 프로바이더를 만들거나 저수준 타입만 필요한 경우입니다.

```bash
bun add @k-msg/core
```

```ts
import {
  type Provider,
  type SendOptions,
  type Result,
  ok,
  fail,
  KMsgError,
  KMsgErrorCode,
} from "@k-msg/core";

export class MyCustomProvider implements Provider {
  readonly id = "my-provider";
  readonly name = "My Custom Provider";
  readonly supportedTypes = ["SMS"] as const;

  async send(options: SendOptions): Promise<Result<SendResult, KMsgError>> {
    // 구현...
  }
}
```

### 템플릿 변수 치환

```
@k-msg/template
```

알림톡 템플릿의 `#{변수명}` 문법을 치환해야 하는 경우입니다.

```bash
bun add @k-msg/template
```

```ts
import { interpolate } from "@k-msg/template";

const message = interpolate(
  "안녕하세요, #{name}님! 인증번호는 #{code}입니다.",
  { name: "홍길동", code: "123456" }
);
// "안녕하세요, 홍길동님! 인증번호는 123456입니다."
```

### 전송 통계 필요

```
@k-msg/analytics + @k-msg/messaging/tracking
```

메시지 전송 결과를 추적하고 통계를 내야 하는 경우입니다.

```bash
bun add k-msg @k-msg/analytics
```

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";
import {
  DeliveryTrackingService,
  createDeliveryTrackingHooks,
} from "@k-msg/messaging/tracking";
import { SqliteDeliveryTrackingStore } from "k-msg/adapters/bun";
import { DeliveryTrackingAnalyticsService } from "@k-msg/analytics";

const providers = [new IWINVProvider({ apiKey: process.env.IWINV_API_KEY! })];
const store = new SqliteDeliveryTrackingStore({ dbPath: "./tracking.db" });

const tracking = new DeliveryTrackingService({ providers, store });
const kmsg = new KMsg({
  providers,
  hooks: createDeliveryTrackingHooks(tracking),
});

// 메시지 전송 후
await kmsg.send({ to: "01012345678", text: "안녕하세요!" });

// 통계 조회
const analytics = new DeliveryTrackingAnalyticsService({ store });
const summary = await analytics.getSummary({
  requestedAt: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date(),
  },
});
```

### 웹훅 연동

```
@k-msg/webhook
```

메시지 전송 이벤트를 외부 시스템으로 전달해야 하는 경우입니다.

```bash
bun add @k-msg/webhook
```

```ts
import {
  WebhookRuntimeService,
  WebhookEventType,
} from "@k-msg/webhook";

const webhook = new WebhookRuntimeService({
  delivery: {
    maxRetries: 3,
    timeoutMs: 30000,
    enabledEvents: [WebhookEventType.MESSAGE_SENT],
  },
});

await webhook.addEndpoint({
  url: "https://my-app.com/webhooks/k-msg",
  active: true,
  events: [WebhookEventType.MESSAGE_SENT],
});
```

### 카카오 채널 관리

```
@k-msg/channel
```

알림톡/친구톡 발신용 카카오 채널을 프로그래밍 방식으로 관리해야 하는 경우입니다.

```bash
bun add @k-msg/channel @k-msg/core
```

```ts
import { KakaoChannelLifecycleService } from "@k-msg/channel";

const service = new KakaoChannelLifecycleService(provider);
const channels = await service.list();
```

## 설치 명령어 요약

| 목적 | 패키지 조합 |
| --- | --- |
| 기본 메시지 전송 | `k-msg @k-msg/provider` |
| Provider 직접 구현 | `@k-msg/core` |
| 템플릿 변수 치환 | `@k-msg/template` |
| 전송 통계 | `k-msg @k-msg/analytics` |
| 웹훅 연동 | `@k-msg/webhook` |
| 채널 관리 | `@k-msg/channel` |

### 패키지 매니저별 설치

```bash
# Bun
bun add k-msg @k-msg/provider

# npm
npm install k-msg @k-msg/provider

# yarn
yarn add k-msg @k-msg/provider

# pnpm
pnpm add k-msg @k-msg/provider
```

## 런타임 어댑터 선택

배달 추적이나 큐를 사용할 때는 런타임에 맞는 어댑터를 선택하세요.

| 런타임 | 어댑터 경로 |
| --- | --- |
| Bun | `k-msg/adapters/bun` 또는 `@k-msg/messaging/adapters/bun` |
| Node.js | `@k-msg/messaging/adapters/node` |
| Cloudflare Workers | `k-msg/adapters/cloudflare` 또는 `@k-msg/messaging/adapters/cloudflare` |

```ts
// Bun
import { SqliteDeliveryTrackingStore } from "k-msg/adapters/bun";

// Cloudflare Workers
import { createD1DeliveryTrackingStore } from "k-msg/adapters/cloudflare";
```

## SOLAPI 사용 시 추가 설치

SOLAPI Provider를 사용하는 경우 `solapi` 패키지가 peer dependency로 필요합니다.

```bash
bun add solapi
```

```ts
import { SolapiProvider } from "@k-msg/provider/solapi";
```
