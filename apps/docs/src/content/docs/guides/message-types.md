---
title: "메시지 타입 비교 가이드"
description: "SMS, LMS, 알림톡, 친구톡, RCS 메시지 타입 비교 및 선택 가이드"
---

K-Message는 다양한 메시지 타입을 지원합니다. 이 가이드에서는 각 타입의 특징과 비용, 적합한 용도를 비교하고, 상황에 맞는 타입 선택 방법을 설명합니다.

## 메시지 타입 개요

### SMS (단문 메시지)

가장 기본적인 텍스트 메시지입니다. 90바이트까지 전송할 수 있으며, 한글로 약 45자(공백 포함) 정도입니다.

**특징:**
- 모든 휴대전화에서 수신 가능
- 발송 즉시 도달
- 이미지 첨부 불가

```ts
await kmsg.send({
  to: "01012345678",
  text: "인증번호는 123456입니다.",
});
```

### LMS (장문 메시지)

90바이트를 초과하는 긴 텍스트를 보낼 수 있습니다. 제목을 포함할 수 있어 공지사항이나 상세 안내에 적합합니다.

**특징:**
- 최대 2,000바이트 (한글 약 1,000자)
- 제목(subject) 추가 가능
- 이미지 첨부는 불가 (이미지 필요시 MMS 사용)

```ts
await kmsg.send({
  type: "LMS",
  to: "01012345678",
  subject: "[공지] 서비스 점검 안내",
  text: "안녕하세요, 고객님. 2024년 1월 15일 새벽 2시부터 4시까지 서비스 점검이 예정되어 있습니다...",
});
```

### MMS (멀티미디어 메시지)

이미지를 첨부할 수 있는 메시지입니다. LMS의 모든 기능에 이미지 첨부 기능이 추가됩니다.

```ts
await kmsg.send({
  type: "MMS",
  to: "01012345678",
  subject: "신상품 출시 안내",
  text: "새로운 상품이 출시되었습니다. 자세한 내용은 이미지를 확인해주세요.",
  media: {
    image: { ref: "https://example.com/product.jpg" },
  },
});
```

### 알림톡 (AlimTalk)

카카오톡 비즈니스 메시지로, 사전에 승인받은 템플릿만 사용할 수 있습니다. 인증번호, 예약 안내 등 정보성 메시지에 주로 사용합니다.

**특징:**
- 카카오톡 이용자에게만 발송 가능
- 사전 승인된 템플릿 필수
- 높은 도달률과 확인률
- SMS로 자동 전환(fallback) 설정 가능

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",
  variables: { code: "123456", expiry: "3분" },
  failover: {
    enabled: true,
    fallbackChannel: "sms",
    fallbackContent: "인증번호는 123456입니다.",
  },
});
```

### 친구톡 (FriendTalk)

카카오톡 채널을 친구 추가한 사용자에게만 발송할 수 있습니다. 템플릿 승인 없이 자유로운 내용 전송이 가능합니다.

**특징:**
- 채널 친구에게만 발송 가능
- 템플릿 승인 불필요
- 이미지, 버튼 첨부 가능
- 마케팅 메시지에 적합

```ts
await kmsg.send({
  type: "FRIENDTALK",
  to: "01012345678",
  text: "오늘만 특별 할인! 50% OFF",
  buttons: [
    { name: "구매하기", type: "WL", urlMobile: "https://shop.example.com" },
  ],
});
```

### RCS (Rich Communication Services)

안드로이드 기본 메시지 앱에서 지원하는 차세대 메시지 규격입니다. 사진, 동영상, 버튼, 카드 등 풍부한 콘텐츠를 전송할 수 있습니다.

**특징:**
- 안드로이드 기본 지원 (iOS는 iOS 18 이상)
- 미디어, 버튼, 카드 형태 지원
- 템플릿 기반(RCS_TPL) 또는 일반 텍스트(RCS_SMS/LMS/MMS)

```ts
// RCS 텍스트 메시지
await kmsg.send({
  type: "RCS_LMS",
  to: "01012345678",
  text: "RCS로 전송하는 장문 메시지입니다.",
  subject: "RCS 안내",
});

// RCS 템플릿 메시지
await kmsg.send({
  type: "RCS_TPL",
  to: "01012345678",
  templateId: "RCS_TEMPLATE_001",
  variables: { name: "홍길동", date: "2024-01-15" },
});
```

## 메시지 타입 비교표

| 타입 | 최대 길이 | 이미지 지원 | 템플릿 필요 | 비용 (건당) | 적합한 용도 |
|------|-----------|-------------|-------------|-------------|-------------|
| SMS | 90바이트 | ❌ | ❌ | 9~15원 | 인증번호, 간단한 알림 |
| LMS | 2,000바이트 | ❌ | ❌ | 25~35원 | 공지사항, 상세 안내 |
| MMS | 2,000바이트 | ✅ | ❌ | 50~80원 | 상품 안내, 이벤트 이미지 |
| 알림톡 | 1,000자 | ✅ | ✅ 필수 | 8~15원 | 인증, 예약/배송 알림 |
| 친구톡 | 1,000자 | ✅ | ❌ | 5~10원 | 마케팅, 프로모션 |
| RCS_SMS | 90바이트 | ❌ | ❌ | 8~12원 | 간단한 알림 |
| RCS_LMS | 2,000바이트 | ❌ | ❌ | 15~25원 | 공지, 상세 안내 |
| RCS_MMS | 2,000바이트 | ✅ | ❌ | 30~50원 | 풍부한 미디어 메시지 |
| RCS_TPL | 유동적 | ✅ | ✅ 필수 | 8~15원 | 템플릿 기반 알림 |

> **비용 안내:** 위 비용은 대략적인 시장 기준이며, 실제 비용은 프로바이더(SOLAPI, IWINV, Aligo 등)와 계약 조건에 따라 다릅니다.

## 타입 선택 가이드

### 1. 수신자 확인

```
카카오톡 사용자인가?
├─ 예 → 알림톡 또는 친구톡 고려
│   ├─ 정보성 메시지인가? → 알림톡
│   └─ 마케팅 메시지인가? → 친구톡 (친구 추가 필요)
└─ 아니오 → SMS/LMS/MMS 또는 RCS
```

### 2. 메시지 성격에 따른 선택

**인증번호, OTP**
- 1순위: 알림톡 (높은 확인률, 저렴)
- 2순위: SMS (범용성)
- 추천 조합: 알림톡 + SMS fallback

**예약/배송 알림**
- 1순위: 알림톡
- 2순위: LMS
- 추천: 알림톡으로 발송, 실패시 LMS 전환

**마케팅/프로모션**
- 1순위: 친구톡 (친구 대상)
- 2순위: RCS_MMS 또는 MMS
- 주의: 친구톡은 친구 추가한 사용자에게만 발송 가능

**공지사항**
- 1순위: LMS
- 2순위: 알림톡 (템플릿 승인 필요시)

### 3. 이미지 첨부 필요시

- MMS: 모든 휴대전화 수신 가능
- 친구톡: 친구에게만, 템플릿 불필요
- RCS_MMS: 안드로이드 기본 지원
- 알림톡: 템플릿에 이미지 포함 승인 필요

### 의사결정 플로우차트

```
시작
  │
  ▼
이미지가 필요한가?
├─ 예 → MMS / RCS_MMS / 친구톡(이미지)
│       │
│       ▼
│   안드로이드 타겟인가?
│   ├─ 예 → RCS_MMS
│   └─ 아니오 → MMS
│
└─ 아니오
    │
    ▼
    90바이트 이내인가?
    ├─ 예 → SMS
    └─ 아니오
        │
        ▼
        카카오톡 이용자인가?
        ├─ 예
        │   │
        │   ▼
        │   템플릿 승인 가능한가?
        │   ├─ 예 → 알림톡
        │   └─ 아니오
        │       │
        │       ▼
        │       채널 친구인가?
        │       ├─ 예 → 친구톡
        │       └─ 아니오 → LMS
        │
        └─ 아니오 → LMS
```

## 코드 예제 모음

### SMS 기본 전송

```ts
import { KMsg } from "k-msg";
import { MockProvider } from "@k-msg/provider";

const kmsg = new KMsg({ providers: [new MockProvider()] });

const result = await kmsg.send({
  to: "01012345678",
  text: "주문이 완료되었습니다.",
});
```

### LMS 제목 포함 전송

```ts
const result = await kmsg.send({
  type: "LMS",
  to: "01012345678",
  subject: "[주문완료] 결제가 완료되었습니다",
  text: `고객님의 주문이 정상적으로 완료되었습니다.

주문번호: ORD-2024-001
결제금액: 25,000원
배송예정일: 2024년 1월 17일

감사합니다.`,
});
```

### 알림톡 + SMS Fallback

```ts
const result = await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "DELIVERY_START",
  variables: {
    orderNo: "ORD-2024-001",
    product: "무선 이어폰",
    date: "1월 17일",
  },
  failover: {
    enabled: true,
    fallbackChannel: "sms",
    fallbackContent:
      "[배송시작] 주문(ORD-2024-001) 상품이 출발했습니다. 오늘 도착 예정.",
  },
});
```

### 친구톡 마케팅 메시지

```ts
const result = await kmsg.send({
  type: "FRIENDTALK",
  to: "01012345678",
  text: `🔥 오늘만 특가 이벤트!

최대 70% 할인 상품을 확인해보세요.
이벤트 기간: 오늘 자정까지`,
  buttons: [
    {
      name: "이벤트 보러가기",
      type: "WL",
      urlMobile: "https://shop.example.com/event",
    },
  ],
});
```

### RCS 메시지

```ts
// RCS 장문 메시지
const result = await kmsg.send({
  type: "RCS_LMS",
  to: "01012345678",
  text: "RCS로 전송하는 풍부한 메시지입니다.",
  subject: "서비스 안내",
});
```

## 지원 메시지 타입 전체 목록

K-Message는 다음 메시지 타입을 지원합니다:

| 타입 | 설명 |
|------|------|
| `SMS` | 단문 메시지 (90바이트) |
| `LMS` | 장문 메시지 (제목 포함) |
| `MMS` | 멀티미디어 메시지 (이미지 첨부) |
| `ALIMTALK` | 카카오 알림톡 (템플릿 필요) |
| `FRIENDTALK` | 카카오 친구톡 |
| `RCS_SMS` | RCS 단문 |
| `RCS_LMS` | RCS 장문 |
| `RCS_MMS` | RCS 멀티미디어 |
| `RCS_TPL` | RCS 템플릿 |
| `RCS_ITPL` | RCS 이미지 템플릿 |
| `RCS_LTPL` | RCS 대형 템플릿 |
| `NSA` | 네이버 스마트 알림 |
| `VOICE` | 음성 메시지 |
| `FAX` | 팩스 전송 |

## 참고 자료

- [시작하기](/guides/getting-started/) - 첫 메시지 전송 가이드
- [API 레퍼런스](/api/) - 상세 API 문서
- [예제](/guides/examples/) - 실제 사용 사례
