---
title: "사용 사례 가이드"
description: "OTP 인증, 주문 알림, 마케팅 메시지 등 실제 비즈니스 시나리오별 구현 가이드"
---

K-Message를 활용한 대표적인 사용 사례를 시나리오별로 정리한 가이드입니다. 각 가이드는 비즈니스 요구사항, 적절한 메시지 타입 선택, 실행 가능한 코드 예제를 포함합니다.

## 왜 시나리오별 가이드인가요?

메시징 시스템은 비즈니스 맥락에 따라 요구사항이 크게 달라집니다. OTP 인증은 도달률과 속도가 핵심이고, 마케팅 메시지는 비용과 스팸 필터링이 중요합니다. 각 시나리오에 맞는 최적의 구현 방법을 알아보세요.

## 가이드 목록

### [OTP 인증 메시지](/guides/use-cases/otp-verification/)

본인 확인, 비밀번호 재설정, 로그인 2단계 인증에 사용하는 OTP 메시지 구현 방법입니다. SMS의 높은 도달률을 활용합니다.

**주요 내용:**
- OTP 생성 및 만료 관리
- SMS 채널 선택 이유
- 재전송 방지 및 속도 제한

### [주문 알림 메시지](/guides/use-cases/order-notification/)

주문 접수, 결제 완료, 배송 시작, 배송 완료 알림 구현 방법입니다. 알림톡의 높은 오픈율을 활용합니다.

**주요 내용:**
- 알림톡 템플릿 활용
- 변수 치환 패턴
- 실패 시 SMS 폴백

### [마케팅 메시지](/guides/use-cases/marketing-message/)

프로모션, 이벤트 안내, 쿠폰 발송 등 마케팅 메시지 구현 방법입니다. 친구톡과 SMS를 상황에 맞게 선택합니다.

**주요 내용:**
- 친구톡 vs SMS 선택 기준
- 대량 발송 패턴
- 수신 동의 관리

## 공통 패턴

모든 사용 사례에서 공통으로 적용되는 패턴입니다.

### Result 패턴으로 에러 처리

K-Message는 예외 대신 `Result` 타입을 반환합니다. 이 방식은 에러 처리를 명시적으로 만듭니다.

```ts
const result = await kmsg.send({
  to: "01012345678",
  text: "메시지 내용",
});

if (result.isSuccess) {
  // 성공 처리
  console.log("전송 성공:", result.value.messageId);
} else {
  // 에러 처리
  console.log("전송 실패:", result.error.message);
}
```

### 템플릿 변수 치환

`#{변수명}` 문법으로 템플릿 변수를 치환합니다.

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "ORDER_COMPLETE",
  variables: {
    orderNumber: "ORD-2024-001",
    productName: "무선 이어폰",
    deliveryDate: "2월 25일",
  },
});
```

### 멀티 프로바이더 구성

프로바이더 장애에 대비해 여러 프로바이더를 구성할 수 있습니다.

```ts
const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
    },
  },
});
```

## 다음 단계

각 가이드에서 해당 시나리오에 맞는 상세 구현 방법을 확인하세요. 프로젝트 요구사항에 맞는 가이드를 선택하면 됩니다.
