# k-msg

주요 공개 API를 재수출(re-export)하는 통합 패키지입니다:

- `@k-msg/messaging`의 `KMsg`
- `@k-msg/provider`의 기본 provider
- `@k-msg/core`의 핵심 타입/유틸리티

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
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
    },
  },
  defaults: {
    sms: { autoLmsBytes: 90 },
  },
});

// 기본 SMS (type 생략)
await kmsg.send({ to: "01012345678", text: "hello" });

// 알림톡
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateCode: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## 런타임 어댑터 경로

런타임 전용 구현은 아래 서브패스로 사용합니다.

- `k-msg/adapters/bun`
- `k-msg/adapters/node`
- `k-msg/adapters/cloudflare`

```ts
import { SqliteDeliveryTrackingStore } from "k-msg/adapters/bun";
import { createD1DeliveryTrackingStore } from "k-msg/adapters/cloudflare";
```
