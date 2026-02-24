---
title: "OTP 인증 메시지"
description: "SMS를 활용한 OTP 인증 메시지 발송 가이드입니다."
---

OTP(일회용 비밀번호) 인증은 본인 확인, 비밀번호 재설정, 2단계 인증 등 보안이 중요한 시나리오에서 널리 사용됩니다. 이 가이드에서는 K-Message를 활용해 안정적인 OTP 인증 시스템을 구축하는 방법을 알아봅니다.

## 시나리오 설명

OTP 인증 메시지의 핵심 요구사항:

1. **높은 도달률**: 사용자가 OTP를 받지 못하면 서비스 이용이 불가능합니다
2. **빠른 전송**: OTP는 보통 3~5분 내에 만료되므로 즉시 전송되어야 합니다
3. **일관된 포맷**: 사용자가 쉽게 코드를 인식하고 입력할 수 있어야 합니다
4. **재전송 방지**: 동일 번호로 과도한 요청을 방지해야 합니다

## 메시지 타입 선택: SMS

OTP 인증에는 **SMS**를 권장합니다.

| 채널 | 장점 | 단점 |
|------|------|------|
| SMS | 모든 휴대폰에서 수신 가능, 높은 도달률 | 건당 비용 발생 |
| 알림톡 | 비용 절감, 높은 오픈율 | 카카오톡 미설치 사용자 제외 |

SMS를 선택하는 이유:

- 모든 사용자가 수신 보장 (카카오톡 설치 여부 무관)
- 네트워크 상태와 무관하게 도달
- 간단한 구현 (템플릿 사전 등록 불필요)

## 전체 코드 예제

### 1. 기본 OTP 발송

```ts
import { KMsg } from "@k-msg/messaging";
import { SolapiProvider } from "@k-msg/provider/solapi";

// KMsg 인스턴스 생성
const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
});

// OTP 생성 함수
function generateOTP(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// OTP 발송 함수
async function sendOTP(phoneNumber: string): Promise<{
  success: boolean;
  otp?: string;
  error?: string;
}> {
  const otp = generateOTP(6);
  const expiresAt = Date.now() + 3 * 60 * 1000; // 3분 후 만료

  // OTP 저장 (Redis, DB 등)
  // await redis.set(`otp:${phoneNumber}`, otp, "EX", 180);

  const result = await kmsg.send({
    to: phoneNumber,
    text: `[인증번호] ${otp}\n인증번호는 3분 내에 입력해주세요.`,
  });

  if (result.isSuccess) {
    return { success: true, otp };
  }
  
  return { success: false, error: result.error.message };
}

// 사용 예시
const result = await sendOTP("01012345678");
if (result.success) {
  console.log("OTP 발송 성공:", result.otp);
} else {
  console.log("OTP 발송 실패:", result.error);
}
```

### 2. 속도 제한 적용

과도한 OTP 요청을 방지하기 위한 속도 제한 구현입니다.

```ts
// Redis 기반 속도 제한 (의사 코드)
async function checkRateLimit(phoneNumber: string): Promise<{
  allowed: boolean;
  remainingSeconds?: number;
}> {
  const key = `otp:limit:${phoneNumber}`;
  const count = await redis.get(key);

  if (count && parseInt(count) >= 5) {
    const ttl = await redis.ttl(key);
    return { allowed: false, remainingSeconds: ttl };
  }

  await redis.incr(key);
  await redis.expire(key, 3600); // 1시간 윈도우

  return { allowed: true };
}

// 속도 제한이 적용된 OTP 발송
async function sendOTPWithRateLimit(phoneNumber: string) {
  const rateCheck = await checkRateLimit(phoneNumber);
  
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `요청 횟수 초과. ${rateCheck.remainingSeconds}초 후 다시 시도해주세요.`,
    };
  }

  return sendOTP(phoneNumber);
}
```

### 3. OTP 검증

```ts
async function verifyOTP(
  phoneNumber: string,
  userInput: string,
): Promise<{ valid: boolean; reason?: string }> {
  const key = `otp:${phoneNumber}`;
  const storedOTP = await redis.get(key);

  if (!storedOTP) {
    return { valid: false, reason: "인증번호가 만료되었습니다." };
  }

  if (storedOTP !== userInput) {
    return { valid: false, reason: "인증번호가 일치하지 않습니다." };
  }

  // 사용된 OTP 삭제
  await redis.del(key);
  
  return { valid: true };
}

// 사용 예시
const verifyResult = await verifyOTP("01012345678", "123456");
if (verifyResult.valid) {
  console.log("인증 성공");
} else {
  console.log("인증 실패:", verifyResult.reason);
}
```

## 에러 처리 방법

### 네트워크 에러

```ts
const result = await kmsg.send({
  to: phoneNumber,
  text: `[인증번호] ${otp}`,
});

if (result.isFailure) {
  const error = result.error;
  
  switch (error.code) {
    case "NETWORK_ERROR":
      console.log("네트워크 오류. 잠시 후 다시 시도해주세요.");
      break;
    case "PROVIDER_ERROR":
      console.log("메시지 서비스 오류. 관리자에게 문의해주세요.");
      break;
    case "INVALID_PHONE_NUMBER":
      console.log("올바르지 않은 전화번호 형식입니다.");
      break;
    default:
      console.log("알 수 없는 오류:", error.message);
  }
}
```

### 폴백 프로바이더 구성

주 프로바이더 장애 시 자동으로 폴백 프로바이더를 사용합니다.

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
    // SMS는 첫 번째 프로바이더 실패 시 다음 프로바이더 사용
    byType: {
      SMS: ["solapi", "iwinv"],
    },
    strategy: "first",
  },
});
```

## 모범 사례

### 1. OTP 포맷 표준화

일관된 포맷으로 사용자 경험을 개선합니다.

```ts
// 권장 포맷
const otpMessage = `[인증번호] ${otp}
인증번호는 3분 내에 입력해주세요.

문의: 고객센터 1588-0000`;

// 피해야 할 포맷
const badMessage = `인증번호는 ${otp}입니다 3분안에 입력하세요`; // 모호함
```

### 2. 로깅 및 모니터링

OTP 발송 이력을 추적합니다.

```ts
const kmsg = new KMsg({
  providers: [/* ... */],
  hooks: {
    onSuccess: (ctx, result) => {
      logger.info("OTP 발송 성공", {
        messageId: result.messageId,
        to: maskPhoneNumber(ctx.options.to),
        timestamp: ctx.timestamp,
      });
    },
    onError: (ctx, error) => {
      logger.error("OTP 발송 실패", {
        to: maskPhoneNumber(ctx.options.to),
        errorCode: error.code,
        errorMessage: error.message,
      });
    },
  },
});

// 전화번호 마스킹
function maskPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-****-$3");
}
```

### 3. 환경별 설정 분리

개발 환경에서는 Mock Provider를 사용합니다.

```ts
import { MockProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: process.env.NODE_ENV === "production"
    ? [
        new SolapiProvider({
          apiKey: process.env.SOLAPI_API_KEY!,
          apiSecret: process.env.SOLAPI_API_SECRET!,
          defaultFrom: "01000000000",
        }),
      ]
    : [new MockProvider()],
});
```

### 4. OTP 길이 및 복잡도

| 용도 | 길이 | 문자 집합 |
|------|------|-----------|
| 로그인 2FA | 6자리 | 숫자만 |
| 결제 인증 | 6자리 | 숫자만 |
| 본인 확인 | 4~6자리 | 숫자만 |

보안 요구사항에 따라 적절한 길이를 선택하세요. 6자리가 일반적으로 권장됩니다.

## 요약

- OTP 인증에는 SMS가 가장 안정적입니다
- 속도 제한으로 남용을 방지하세요
- Result 패턴으로 명시적인 에러 처리를 하세요
- 폴백 프로바이더로 가용성을 높이세요
- 로깅으로 이슈 추적이 가능하게 하세요
