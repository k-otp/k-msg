# k-msg

한국형 멀티채널 메시징 툴킷(프로바이더 주입 + 단일 `send()` UX).

최상위 사용 방식은 아래로 통일됩니다:

- `new KMsg({ providers, routing, defaults, hooks })`
- `kmsg.send({ type, ... })` (`type` 생략 시 기본 문자(SMS)로 처리)

## 설치

```bash
npm install k-msg
# or
bun add k-msg
```

## 빠른 시작

```ts
import { IWINVProvider, KMsg, SolapiProvider } from "k-msg";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
      smsSenderNumber: "01000000000",
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
    },
  },
  defaults: {
    from: "01000000000",
    sms: { autoLmsBytes: 90 },
  },
});

// 기본 문자(SMS): type 생략 가능
await kmsg.send({ to: "01012345678", text: "hello" });

// 알림톡
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateCode: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## 패키지 구성

- `@k-msg/core`: 표준 타입/에러/Result/복원력 유틸(`Provider`, `SendOptions`, `Result`, `KMsgError`, ...)
- `@k-msg/messaging`: `KMsg` Facade(정규화 + 라우팅)
- `@k-msg/provider`: 기본 프로바이더(SOLAPI / IWINV / Aligo)
- `@k-msg/template`: 템플릿 치환 유틸
- `@k-msg/analytics`, `@k-msg/webhook`, `@k-msg/channel`: 선택 구성요소

## 브레이킹 변경사항

- Legacy `Platform` / `UniversalProvider` / `StandardRequest` 공개 API 제거
- 메시지 구분 필드는 `type`로 통일(기존 `channel` 제거)
- `templateId` → `templateCode`로 통일

