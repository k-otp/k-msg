---
title: "시작하기"
description: "K-Message로 첫 메시지를 보내는 단계별 가이드"
---

이 가이드에서는 K-Message를 설치하고 첫 메시지를 보내는 방법을 단계별로 알아봅니다. API 키 없이 테스트할 수 있는 Mock Provider를 사용합니다.

## K-Message란?

K-Message는 한국형 멀티채널 메시징 라이브러리입니다. 알림톡, 친구톡, SMS, LMS를 하나의 API로 처리하며, 여러 메시지 프로바이더(SOLAPI, IWINV, Aligo 등)를 플러그인 방식으로 교체할 수 있습니다.

**핵심 특징:**

- `send()` 하나로 모든 채널 전송
- 프로바이더 교체 가능 (SOLAPI, IWINV, Aligo, Mock)
- Result 패턴으로 에러 처리

## 설치

Bun을 사용하는 경우:

```bash
bun add k-msg @k-msg/provider
```

npm을 사용하는 경우:

```bash
npm install k-msg @k-msg/provider
```

## 첫 메시지 보내기 (API 키 불필요)

Mock Provider를 사용하면 API 키 없이 코드를 테스트할 수 있습니다.

### 가장 간단한 방법: `new KMsg()`

```ts
import { KMsg } from "k-msg";
import { MockProvider } from "@k-msg/provider";

// 프로바이더 하나로 간단하게 시작
const kmsg = new KMsg({
  providers: [new MockProvider()],
});

// 메시지 전송
const result = await kmsg.send({
  to: "01012345678",
  text: "안녕하세요, 첫 메시지입니다!",
});

// 결과 확인
if (result.isSuccess) {
  console.log("전송 성공:", result.value.messageId);
} else {
  console.log("전송 실패:", result.error.message);
}
```

### Builder 패턴으로 설정

여러 프로바이더나 상세 설정이 필요하면 `KMsg.builder()`를 사용합니다.

```ts
import { KMsg } from "k-msg";
import { MockProvider } from "@k-msg/provider";

const kmsg = KMsg.builder()
  .addProvider(new MockProvider())
  .withDefaults({ sms: { autoLmsBytes: 90 } })
  .build();

const result = await kmsg.send({
  to: "01012345678",
  text: "Builder 패턴으로 전송!",
});
```

### 정적 팩토리 메서드: `KMsg.create()`

```ts
import { KMsg } from "k-msg";
import { MockProvider } from "@k-msg/provider";

const kmsg = KMsg.create({
  providers: [new MockProvider()],
});

const result = await kmsg.send({
  to: "01012345678",
  text: "안녕하세요, 첫 메시지입니다!",
});
```

**코드 설명:**

1. `MockProvider`는 실제 API 호출 없이 성공/실패를 시뮬레이션합니다
2. `to`는 수신자 전화번호 (하이픈 없이)
3. `text`는 메시지 내용
4. 결과는 `Result` 타입으로 반환됩니다 (`isSuccess` 또는 `isFailure`)

## Result 패턴으로 에러 처리하기

K-Message는 예외를 던지지 않고 `Result` 타입을 반환합니다. 이 방식은 에러 처리를 명시적으로 만듭니다.

```ts
const result = await kmsg.send({
  to: "01012345678",
  text: "테스트 메시지",
});

if (result.isSuccess) {
  // 성공: result.value에 SendResult가 있음
  const { messageId, status, providerMessageId } = result.value;
  console.log(`메시지 ID: ${messageId}`);
  console.log(`상태: ${status}`);
} else {
  // 실패: result.error에 KMsgError가 있음
  console.log(`에러 코드: ${result.error.code}`);
  console.log(`에러 메시지: ${result.error.message}`);
}
```

### Result 헬퍼 메서드

```ts
import { Result } from "@k-msg/core";

// tap: 성공/실패 관계없이 부수 효과 실행
Result.tap(result, (r) => console.log("완료:", r));

// tapOk: 성공 시에만 실행
Result.tapOk(result, (value) => console.log("성공:", value.messageId));

// tapErr: 실패 시에만 실행
Result.tapErr(result, (error) => console.log("실패:", error.message));

// expect: 성공 시 값 반환, 실패 시 에러 throw
const sendResult = Result.expect(result, "메시지 전송 실패");
```

## 메시지 타입 지정하기

`type`을 지정하면 알림톡, 친구톡 등 다른 채널로 전송할 수 있습니다. `type`을 생략하면 SMS로 처리됩니다.

```ts
// SMS 전송 (기본값)
await kmsg.send({ to: "01012345678", text: "SMS 메시지" });

// 알림톡 전송
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## 실제 프로바이더로 전환하기

운영 환경에서는 Mock Provider를 실제 프로바이더로 교체합니다. 코드 구조는 그대로 유지됩니다.

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";

// Builder 패턴으로 여러 프로바이더 설정
const kmsg = KMsg.builder()
  .addProvider(
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  )
  .addProvider(
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
      smsSenderNumber: "01000000000",
    }),
  )
  .withRouting({
    defaultProviderId: "solapi",
    byType: { ALIMTALK: "iwinv" },
  })
  .build();

// 전송 코드는 동일
const result = await kmsg.send({
  to: "01012345678",
  text: "실제 메시지 전송",
});
```

## 초기화 방식 비교

| 방식 | 용도 | 예시 |
|------|------|------|
| `new KMsg()` | 단일 프로바이더, 가장 단순한 초기화 | `new KMsg({ providers: [new MockProvider()] })` |
| `KMsg.builder()` | 여러 프로바이더, 상세 설정 | `KMsg.builder().addProvider(...).build()` |
| `KMsg.create()` | 정적 팩토리 호출 선호 시 | `KMsg.create({ providers: [...] })` |


## 민감 정보 암호화 (선택)

전화번호 등 민감 정보를 암호화해서 저장해야 하는 경우, K-Message는 필드 단위 암호화를 지원합니다. Delivery Tracking과 함께 사용하면 전송 기록을 안전하게 보관할 수 있습니다.

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";
import {
  createAesGcmFieldCryptoProvider,
  type FieldCryptoConfig,
} from "@k-msg/core";

// 암호화 제공자 생성
const cryptoProvider = createAesGcmFieldCryptoProvider({
  activeKid: "k-2024-01",
  keys: {
    "k-2024-01": process.env.KMSG_AES_KEY_BASE64URL!,
  },
  hashKeys: {
    "k-2024-01": process.env.KMSG_HMAC_KEY_BASE64URL!,
  },
  keyEncoding: "base64url",
  hashKeyEncoding: "base64url",
});

// 필드 암호화 설정
const fieldCrypto: FieldCryptoConfig = {
  enabled: true,
  failMode: "closed", // 암호화 실패 시 전송 중단
  fields: {
    to: "encrypt+hash",   // 수신자 번호: 암호화 + 해시
    from: "encrypt+hash", // 발신자 번호: 암호화 + 해시
  },
  provider: cryptoProvider,
};

// Delivery Tracking Store에 적용 (D1 예시)
import { createD1DeliveryTrackingStore } from "@k-msg/messaging/adapters/cloudflare";

const trackingStore = createD1DeliveryTrackingStore(env.DB, {
  tableName: "message_tracking",
  fieldCryptoSchema: {
    enabled: true,
    mode: "secure",
  },
  fieldCrypto: {
    config: fieldCrypto,
    tenantId: "my-service",
  },
});
```

**주요 기능:**

- `encrypt+hash`: 암호화 + 해시 (조회용 해시 컬럼 자동 생성)
- `failMode: "closed"`: 암호화 실패 시 안전하게 중단
- 키 로테이션 지원 (여러 키 동시 운영)

자세한 내용은 [보안 가이드](/guides/security/field-crypto-v1/)를 참조하세요.

## 다음 단계

- [개요](/guides/overview/)에서 프로젝트 구조와 기능 확인
- [패키지 가이드](/guides/packages/)에서 각 패키지 상세 정보
- [예제](/guides/examples/)에서 실제 사용 사례
