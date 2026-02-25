---
title: "주문 알림 메시지"
description: "알림톡을 활용한 주문 접수, 배송 안내 메시지 발송 가이드입니다."
---

주문 알림은 이커머스 서비스에서 고객 경험의 핵심입니다. 주문 접수부터 배송 완료까지 각 단계에서 적절한 알림을 보내면 고객 만족도를 높이고 문의 전화를 줄일 수 있습니다. 이 가이드에서는 알림톡을 활용한 주문 알림 시스템 구축 방법을 알아봅니다.

## 시나리오 설명

주문 알림의 주요 단계:

1. **주문 접수**: 고객이 주문을 완료했을 때
2. **결제 완료**: 결제가 정상적으로 처리되었을 때
3. **배송 시작**: 택배사에 상품이 인계되었을 때
4. **배송 완료**: 상품이 고객에게 배송되었을 때

각 단계에서 필요한 정보:
- 주문 번호
- 상품 정보
- 배송지 정보
- 예상 배송일
- 운송장 번호 (배송 시작 시)

## 메시지 타입 선택: 알림톡

주문 알림에는 **알림톡**을 권장합니다.

| 채널 | 오픈율 | 비용 | 특징 |
|------|--------|------|------|
| 알림톡 | 90%+ | 낮음 | 템플릿 사전 등록 필수 |
| SMS | 70~80% | 보통 | 모든 사용자 수신 가능 |
| 이메일 | 20~30% | 무료 | 즉시성 낮음 |

알림톡을 선택하는 이유:

- 높은 오픈율로 정보 전달 확실
- 건당 비용이 SMS보다 저렴
- 포맷팅 가능 (버튼, 이미지 등)
- 카카오톡 사용자 대상 높은 도달률

### 폴백 전략

카카오톡 미사용자를 위해 SMS 폴백을 구성하세요.

## 전체 코드 예제

### 1. KMsg 인스턴스 구성

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    // 알림톡용 IWINV 프로바이더
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
      smsSenderNumber: "01000000000",
    }),
    // SMS 폴백용 SOLAPI 프로바이더
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
    },
  },
  defaults: {
    kakao: {
      profileId: process.env.KAKAO_PF_ID!, // 카카오 채널 프로필 ID
    },
  },
});
```

### 2. 주문 접수 알림

```ts
interface OrderInfo {
  orderId: string;
  customerPhone: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  deliveryAddress: string;
}

async function sendOrderConfirmation(order: OrderInfo) {
  const itemSummary = order.items
    .map((item) => `${item.name} ${item.quantity}개`)
    .join(", ");

  const result = await kmsg.send({
    type: "ALIMTALK",
    to: order.customerPhone,
    templateId: "ORDER_CONFIRM", // 사전 등록된 템플릿 코드
    variables: {
      orderId: order.orderId,
      customerName: order.customerName,
      items: itemSummary,
      totalAmount: order.totalAmount.toLocaleString() + "원",
      address: order.deliveryAddress,
    },
    failover: {
      enabled: true,
      fallbackChannel: "sms",
      fallbackContent: `[주문접수] ${order.customerName}님, 주문이 완료되었습니다. 주문번호: ${order.orderId}`,
    },
  });

  if (result.isSuccess) {
    console.log("주문 알림 발송 성공:", result.value.messageId);
  } else {
    console.log("주문 알림 발송 실패:", result.error.message);
  }

  return result;
}

// 사용 예시
await sendOrderConfirmation({
  orderId: "ORD-2024-0224-001",
  customerPhone: "01012345678",
  customerName: "홍길동",
  items: [
    { name: "무선 이어폰", quantity: 1, price: 129000 },
    { name: "케이스", quantity: 2, price: 15000 },
  ],
  totalAmount: 159000,
  deliveryAddress: "서울시 강남구 역삼동 123",
});
```

### 3. 배송 시작 알림

```ts
interface DeliveryInfo {
  orderId: string;
  customerPhone: string;
  customerName: string;
  courierName: string; // 택배사명
  trackingNumber: string; // 운송장 번호
  estimatedDate: string; // 예상 도착일
}

async function sendShippingNotification(delivery: DeliveryInfo) {
  const result = await kmsg.send({
    type: "ALIMTALK",
    to: delivery.customerPhone,
    templateId: "SHIPPING_START", // 사전 등록된 템플릿 코드
    variables: {
      orderId: delivery.orderId,
      customerName: delivery.customerName,
      courier: delivery.courierName,
      trackingNumber: delivery.trackingNumber,
      estimatedDate: delivery.estimatedDate,
    },
    failover: {
      enabled: true,
      fallbackChannel: "sms",
      fallbackContent: `[배송시작] ${delivery.customerName}님, 상품이 발송되었습니다. 운송장: ${delivery.trackingNumber} (${delivery.courierName})`,
    },
  });

  return result;
}

// 사용 예시
await sendShippingNotification({
  orderId: "ORD-2024-0224-001",
  customerPhone: "01012345678",
  customerName: "홍길동",
  courierName: "CJ대한통운",
  trackingNumber: "123456789012",
  estimatedDate: "2월 26일",
});
```

### 4. 배송 완료 알림

```ts
interface DeliveryCompleteInfo {
  orderId: string;
  customerPhone: string;
  customerName: string;
  productName: string;
  deliveredAt: string;
}

async function sendDeliveryCompleteNotification(info: DeliveryCompleteInfo) {
  const result = await kmsg.send({
    type: "ALIMTALK",
    to: info.customerPhone,
    templateId: "DELIVERY_COMPLETE", // 사전 등록된 템플릿 코드
    variables: {
      orderId: info.orderId,
      customerName: info.customerName,
      productName: info.productName,
      deliveredAt: info.deliveredAt,
    },
    failover: {
      enabled: true,
      fallbackChannel: "sms",
      fallbackContent: `[배송완료] ${info.customerName}님, 상품이 배송되었습니다. 문의: 고객센터`,
    },
  });

  return result;
}

// 사용 예시
await sendDeliveryCompleteNotification({
  orderId: "ORD-2024-0224-001",
  customerPhone: "01012345678",
  customerName: "홍길동",
  productName: "무선 이어폰 외 1건",
  deliveredAt: "2월 25일 오후 2시",
});
```

### 5. 주문 취소 알림

```ts
interface CancelInfo {
  orderId: string;
  customerPhone: string;
  customerName: string;
  cancelReason: string;
  refundAmount: number;
  refundMethod: string;
}

async function sendCancellationNotification(cancel: CancelInfo) {
  const result = await kmsg.send({
    type: "ALIMTALK",
    to: cancel.customerPhone,
    templateId: "ORDER_CANCEL", // 사전 등록된 템플릿 코드
    variables: {
      orderId: cancel.orderId,
      customerName: cancel.customerName,
      cancelReason: cancel.cancelReason,
      refundAmount: cancel.refundAmount.toLocaleString() + "원",
      refundMethod: cancel.refundMethod,
    },
    failover: {
      enabled: true,
      fallbackChannel: "sms",
      fallbackContent: `[주문취소] ${cancel.customerName}님, 주문이 취소되었습니다. 환불: ${cancel.refundAmount.toLocaleString()}원`,
    },
  });

  return result;
}
```

## 템플릿 등록 가이드

알림톡 템플릿은 카카오비즈니스 채널 관리자에서 사전 등록해야 합니다.

### 주문 접수 템플릿 예시

```
#{customerName}님, 주문이 완료되었습니다.

📦 주문번호: #{orderId}
📋 상품: #{items}
💰 총 금액: #{totalAmount}
📍 배송지: #{address}

문의사항은 고객센터로 연락해주세요.
```

### 배송 시작 템플릿 예시

```
#{customerName}님, 주문하신 상품이 발송되었습니다.

📦 주문번호: #{orderId}
🚚 택배사: #{courier}
📮 운송장: #{trackingNumber}
📅 도착예정: #{estimatedDate}

배송 조회는 택배사 홈페이지에서 가능합니다.
```

## 에러 처리 방법

### 템플릿 에러

```ts
const result = await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "ORDER_CONFIRM",
  variables: { /* ... */ },
});

if (result.isFailure) {
  const error = result.error;
  
  // 템플릿 관련 에러 처리
  if (error.code === "TEMPLATE_NOT_FOUND") {
    console.log("템플릿이 등록되지 않았습니다. 카카오 채널 관리자에서 확인해주세요.");
  } else if (error.code === "TEMPLATE_MISMATCH") {
    console.log("템플릿 변수가 일치하지 않습니다. 변수명을 확인해주세요.");
  } else if (error.code === "KAKAO_NOT_USER") {
    console.log("카카오톡 미사용자입니다. SMS 폴백이 필요합니다.");
  }
}
```

### 폴백 활성화 확인

```ts
// 폴백이 활성화된 상태에서 알림톡 실패 시 자동 SMS 전환
const result = await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "ORDER_CONFIRM",
  variables: { /* ... */ },
  failover: {
    enabled: true,
    fallbackChannel: "sms",
    fallbackContent: "폴백 SMS 내용",
  },
});

// 폴백 결과 확인
if (result.isSuccess) {
  console.log("발송 성공:", result.value.type); // "ALIMTALK" 또는 "SMS"
}
```

## 모범 사례

### 1. 알림 타이밍 최적화

```ts
// 배송 완료 알림은 실제 완료 후 30분 정도 지연
async function scheduleDeliveryCompleteNotification(info: DeliveryCompleteInfo) {
  // 실제로는 큐 시스템(예: BullMQ)을 사용
  setTimeout(async () => {
    await sendDeliveryCompleteNotification(info);
  }, 30 * 60 * 1000); // 30분 후
}
```

### 2. 알림 이력 관리

```ts
interface NotificationLog {
  orderId: string;
  type: "ORDER_CONFIRM" | "SHIPPING_START" | "DELIVERY_COMPLETE" | "ORDER_CANCEL";
  sentAt: Date;
  messageId: string;
  status: "SUCCESS" | "FAILED";
}

async function logNotification(
  orderId: string,
  type: NotificationLog["type"],
  result: { isSuccess: boolean; value?: any; error?: any },
) {
  const log: NotificationLog = {
    orderId,
    type,
    sentAt: new Date(),
    messageId: result.isSuccess ? result.value.messageId : "",
    status: result.isSuccess ? "SUCCESS" : "FAILED",
  };

  // DB에 저장
  // await db.notificationLogs.create(log);
}
```

### 3. 개인정보 보호

```ts
// 배송지 주소 마스킹
function maskAddress(address: string): string {
  // 상세 주소 일부 마스킹
  return address.replace(/(\d{3})$/, "***");
}

// 템플릿 변수에 마스킹된 값 사용
const variables = {
  // ...
  address: maskAddress(order.deliveryAddress),
};
```

### 4. 멀티 프로바이더 구성

알림톡 프로바이더 장애에 대비한 구성입니다.

```ts
const kmsg = new KMsg({
  providers: [
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
    }),
    new AligoProvider({
      apiKey: process.env.ALIGO_API_KEY!,
      userId: process.env.ALIGO_USER_ID!,
      senderKey: process.env.ALIGO_SENDER_KEY!,
    }),
  ],
  routing: {
    byType: {
      ALIMTALK: ["iwinv", "aligo"], // 순차적 폴백
    },
    strategy: "first",
  },
});
```

## 요약

- 주문 알림에는 알림톡이 효과적입니다 (높은 오픈율, 낮은 비용)
- 카카오톡 미사용자를 위해 SMS 폴백을 구성하세요
- 템플릿은 사전 등록이 필수입니다
- 배송 시작 알림에는 운송장 번호를 포함하세요
- 알림 이력을 관리해 CS 대응을 개선하세요
