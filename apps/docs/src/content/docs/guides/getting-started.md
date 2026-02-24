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
bun add @k-msg/messaging @k-msg/provider
```

npm을 사용하는 경우:

```bash
npm install @k-msg/messaging @k-msg/provider
```

## 첫 메시지 보내기 (API 키 불필요)

Mock Provider를 사용하면 API 키 없이 코드를 테스트할 수 있습니다.

```ts
import { KMsg } from "@k-msg/messaging";
import { MockProvider } from "@k-msg/provider";

// 1. KMsg 인스턴스 생성
const kmsg = new KMsg({
  providers: [new MockProvider()],
});

// 2. 메시지 전송
const result = await kmsg.send({
  to: "01012345678",
  text: "안녕하세요, 첫 메시지입니다!",
});

// 3. 결과 확인
if (result.ok) {
  console.log("전송 성공:", result.value.messageId);
} else {
  console.log("전송 실패:", result.error.message);
}
```

**코드 설명:**

1. `MockProvider`는 실제 API 호출 없이 성공/실패를 시뮬레이션합니다
2. `to`는 수신자 전화번호 (하이픈 없이)
3. `text`는 메시지 내용
4. 결과는 `Result` 타입으로 반환됩니다 (`ok` 또는 `fail`)

## Result 패턴으로 에러 처리하기

K-Message는 예외를 던지지 않고 `Result` 타입을 반환합니다. 이 방식은 에러 처리를 명시적으로 만듭니다.

```ts
const result = await kmsg.send({
  to: "01012345678",
  text: "테스트 메시지",
});

if (result.ok) {
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

// 전송 코드는 동일
const result = await kmsg.send({
  to: "01012345678",
  text: "실제 메시지 전송",
});
```

## 다음 단계

- [개요](/guides/overview/)에서 프로젝트 구조와 기능 확인
- [패키지 가이드](/guides/packages/)에서 각 패키지 상세 정보
- [예제](/guides/examples/)에서 실제 사용 사례
