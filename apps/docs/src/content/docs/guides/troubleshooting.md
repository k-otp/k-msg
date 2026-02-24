---
title: "트러블슈팅 가이드"
description: "K-Message 사용 중 발생할 수 있는 일반적인 문제와 해결 방법을 안내합니다."
---

K-Message를 사용하면서 마주칠 수 있는 일반적인 에러와 해결 방법을 정리했습니다. 문제가 발생했을 때 먼저 이 가이드를 참고해 주세요.

## 에러 코드 개요

K-Message는 모든 에러를 `KMsgError` 객체로 반환합니다. `result.error.code`를 통해 에러 코드를 확인할 수 있습니다.

```ts
const result = await kmsg.send({ to: "01012345678", text: "테스트" });

if (!result.ok) {
  console.log("에러 코드:", result.error.code);
  console.log("에러 메시지:", result.error.message);
  
  // 프로바이더에서 추가 정보가 있을 수 있음
  if (result.error.providerErrorCode) {
    console.log("프로바이더 에러:", result.error.providerErrorCode);
  }
}
```

## 자주 발생하는 에러

### INVALID_REQUEST

**원인**

요청 데이터가 올바르지 않을 때 발생합니다.

- 필수 필드 누락 (`to`, `text` 등)
- 전화번호 형식 오류
- 지원하지 않는 메시지 타입 지정
- 변수 치환 실패

**해결 방법**

1. 필수 필드가 모두 포함되었는지 확인합니다
2. 전화번호는 하이픈 없이 `01012345678` 형식으로 입력합니다
3. `type` 값은 `"SMS"`, `"LMS"`, `"ALIMTALK"`, `"FRIENDTALK"` 중 하나여야 합니다

**코드 예제**

```ts
// 잘못된 예: 전화번호 형식 오류
await kmsg.send({ to: "010-1234-5678", text: "테스트" }); // 에러

// 올바른 예
await kmsg.send({ to: "01012345678", text: "테스트" });

// 잘못된 예: 필수 필드 누락
await kmsg.send({ to: "01012345678" }); // text 누락

// 올바른 예
await kmsg.send({ to: "01012345678", text: "메시지 내용" });
```

### AUTHENTICATION_FAILED

**원인**

API 인증에 실패했을 때 발생합니다.

- API 키가 잘못되었거나 만료됨
- API Secret 불일치
- 환경 변수 미설정

**해결 방법**

1. 프로바이더 설정의 API 키가 올바른지 확인합니다
2. 환경 변수가 실제로 로드되었는지 확인합니다
3. 프로바이더 대시보드에서 API 키 상태를 확인합니다

**코드 예제**

```ts
// 환경 변수 확인
console.log("API Key 설정됨:", !!process.env.SOLAPI_API_KEY);
console.log("API Secret 설정됨:", !!process.env.SOLAPI_API_SECRET);

// 프로바이더 설정
const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,    // undefined면 인증 실패
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
});
```

### INSUFFICIENT_BALANCE

**원인**

잔액이 부족하여 메시지를 전송할 수 없을 때 발생합니다.

**해결 방법**

1. 프로바이더 대시보드에서 잔액을 충전합니다
2. `BalanceProvider` 기능을 사용해 미리 잔액을 확인합니다

**코드 예제**

```ts
import { isBalanceProvider } from "@k-msg/core";

// 잔액 확인 (프로바이더가 지원하는 경우)
const provider = new SolapiProvider({ /* ... */ });

if (isBalanceProvider(provider)) {
  const balance = await provider.getBalance();
  if (balance.ok) {
    console.log(`현재 잔액: ${balance.value.balance}원`);
    
    if (balance.value.balance < 100) {
      console.log("잔액이 부족합니다. 충전이 필요합니다.");
    }
  }
}
```

### TEMPLATE_NOT_FOUND

**원인**

알림톡 전송 시 지정한 템플릿을 찾을 수 없을 때 발생합니다.

- 템플릿 ID가 잘못됨
- 템플릿이 승인되지 않음
- 다른 카카오 채널의 템플릿 ID 사용

**해결 방법**

1. 프로바이더 대시보드에서 템플릿 ID를 정확히 확인합니다
2. 템플릿 상태가 '승인'인지 확인합니다
3. 발신 프로필(플러스친구)이 올바르게 연결되었는지 확인합니다

**코드 예제**

```ts
// 잘못된 예: 존재하지 않는 템플릿
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "WRONG_TEMPLATE",  // 등록되지 않은 템플릿
});

// 올바른 예: 승인된 템플릿 ID 사용
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",  // 승인된 템플릿
  variables: { code: "123456" },
});
```

### NETWORK_ERROR

**원인**

네트워크 연결 문제로 요청이 실패했을 때 발생합니다.

- 인터넷 연결 끊김
- 방화벽 차단
- DNS 해석 실패

**해결 방법**

1. 네트워크 연결 상태를 확인합니다
2. 프로바이더 API 서버가 정상인지 확인합니다
3. 재시도 로직을 구현합니다

**코드 예제**

```ts
const result = await kmsg.send({ to: "01012345678", text: "테스트" });

if (!result.ok && result.error.code === "NETWORK_ERROR") {
  // 네트워크 에러는 재시도 가능
  console.log("네트워크 오류. 잠시 후 재시도합니다.");
  
  // 3초 후 재시도
  await new Promise(resolve => setTimeout(resolve, 3000));
  const retryResult = await kmsg.send({ to: "01012345678", text: "테스트" });
}
```

### NETWORK_TIMEOUT

**원인**

요청이 시간 내에 완료되지 않아 타임아웃이 발생했습니다.

**해결 방법**

1. 네트워크 상태를 확인합니다
2. 대량 전송 시 배치 크기를 줄입니다
3. 타임아웃 설정을 늘립니다 (프로바이더 설정)

### NETWORK_SERVICE_UNAVAILABLE

**원인**

프로바이더 서비스가 일시적으로 사용할 수 없는 상태입니다.

**해결 방법**

1. 몇 분 후 다시 시도합니다
2. 프로바이더 공지사항에서 장애 정보를 확인합니다
3. 다중 프로바이더 설정으로 페일오버를 구현합니다

**코드 예제**

```ts
// 다중 프로바이더로 자동 페일오버
const kmsg = new KMsg({
  providers: [
    new SolapiProvider({ /* 기본 프로바이더 */ }),
    new IWINVProvider({ /* 백업 프로바이더 */ }),
  ],
  routing: {
    defaultProviderId: "solapi",
  },
});
```

### PROVIDER_ERROR

**원인**

프로바이더 내부 오류가 발생했습니다.

- 프로바이더 서버 오류
- 알 수 없는 프로바이더 응답
- 일시적인 장애

**해결 방법**

1. `providerErrorCode`와 `providerErrorText`를 확인합니다
2. 프로바이더 문서에서 에러 코드를 조회합니다
3. 지속되면 프로바이더 고객센터에 문의합니다

**코드 예제**

```ts
if (!result.ok && result.error.code === "PROVIDER_ERROR") {
  console.log("프로바이더 에러 코드:", result.error.providerErrorCode);
  console.log("프로바이더 에러 메시지:", result.error.providerErrorText);
  console.log("HTTP 상태:", result.error.httpStatus);
  
  // 이 정보로 프로바이더 문서에서 원인 파악
}
```

## 재시도 가능한 에러

다음 에러 코드는 자동 재시도가 가능합니다.

| 에러 코드 | 재시도 권장 |
|-----------|-------------|
| `NETWORK_ERROR` | O |
| `NETWORK_TIMEOUT` | O |
| `NETWORK_SERVICE_UNAVAILABLE` | O |
| `RATE_LIMIT_EXCEEDED` | O (대기 후) |
| `PROVIDER_ERROR` | O (5xx 응답인 경우) |
| `INVALID_REQUEST` | X |
| `AUTHENTICATION_FAILED` | X |
| `INSUFFICIENT_BALANCE` | X |
| `TEMPLATE_NOT_FOUND` | X |

## FAQ

### API 키는 어디서 발급받나요?

각 프로바이더의 웹사이트에서 회원가입 후 API 키를 발급받을 수 있습니다.

| 프로바이더 | 발급처 |
|------------|--------|
| SOLAPI | https://solapi.com 콘솔 |
| IWINV | https://www.iwinv.kr 고객센터 |
| Aligo | https://www.aligo.co.kr 관리자 페이지 |

발급받은 API 키는 환경 변수로 관리하는 것이 안전합니다.

```bash
# .env
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
```

### 알림톡 템플릿은 어떻게 등록하나요?

알림톡 템플릿은 카카오비즈니스 채널과 연결된 프로바이더 대시보드에서 등록합니다.

1. **발신 프로필(플러스친구) 생성**: 카카오비즈니스에서 플러스친구를 생성합니다
2. **프로바이더 연동**: 사용 중인 프로바이더(SOLAPI, IWINV 등) 대시보드에서 발신 프로필을 연동합니다
3. **템플릿 등록**: 알림톡 템플릿을 작성하고 카카오 심사를 요청합니다
4. **승인 대기**: 보통 1~2일 내 승인 완료
5. **사용**: 승인된 템플릿 ID로 메시지 전송

```ts
// 승인된 템플릿 사용
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "APPROVED_TEMPLATE_ID",
  variables: { name: "홍길동" },
});
```

### SMS가 전송되지 않아요

SMS 전송 실패의 일반적인 원인을 순서대로 확인해 보세요.

1. **잔액 확인**: 프로바이더 잔액이 충분한지 확인합니다
2. **발신 번호 확인**: 발신 번호가 사전 등록된 번호인지 확인합니다
3. **수신 번호 형식**: `01012345678` 형식(하이픈 없이)인지 확인합니다
4. **네트워크 상태**: 인터넷 연결이 정상인지 확인합니다
5. **에러 코드 확인**: 반환된 에러 코드로 구체적 원인을 파악합니다

```ts
const result = await kmsg.send({ to: "01012345678", text: "테스트" });

if (!result.ok) {
  // 구체적 에러 확인
  console.log("에러 코드:", result.error.code);
  console.log("에러 메시지:", result.error.message);
  
  switch (result.error.code) {
    case "INSUFFICIENT_BALANCE":
      console.log("잔액을 충전해 주세요.");
      break;
    case "AUTHENTICATION_FAILED":
      console.log("API 키를 확인해 주세요.");
      break;
    case "INVALID_REQUEST":
      console.log("요청 데이터를 확인해 주세요.");
      break;
    default:
      console.log("일시적인 오류일 수 있습니다. 잠시 후 재시도해 주세요.");
  }
}
```

### 잔액 확인은 어떻게 하나요?

`BalanceProvider` 기능을 지원하는 프로바이더에서는 코드로 잔액을 조회할 수 있습니다.

```ts
import { KMsg } from "k-msg";
import { SolapiProvider } from "@k-msg/provider/solapi";
import { isBalanceProvider } from "@k-msg/core";

const provider = new SolapiProvider({
  apiKey: process.env.SOLAPI_API_KEY!,
  apiSecret: process.env.SOLAPI_API_SECRET!,
  defaultFrom: "01000000000",
});

// 잔액 조회 지원 여부 확인
if (isBalanceProvider(provider)) {
  const result = await provider.getBalance();
  
  if (result.ok) {
    console.log(`잔액: ${result.value.balance}원`);
    console.log(`포인트: ${result.value.point}원`);
  } else {
    console.log("잔액 조회 실패:", result.error.message);
  }
} else {
  console.log("이 프로바이더는 잔액 조회를 지원하지 않습니다.");
}
```

**주의**: 모든 프로바이더가 잔액 조회를 지원하지 않습니다. 지원 여부는 각 프로바이더 문서를 참고하세요.

## 추가 도움말

이 가이드에서 해결되지 않는 문제는 다음 방법으로 도움을 받을 수 있습니다.

- [GitHub Issues](https://github.com/your-org/k-msg/issues): 버그 리포트나 기능 요청
- 프로바이더 고객센터: 각 프로바이더별 기술 지원
- 에러 로그: `result.error.toJSON()`으로 전체 에러 정보 출력
