# @k-msg/provider

`k-msg`용 provider 구현 패키지입니다. (`SendOptions + Result` 기반)

## 설치

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

SOLAPI provider를 사용할 경우, 앱에서 `solapi`를 별도로 설치해야 합니다:

```bash
npm install solapi
# or
bun add solapi
```

## 기본 제공 Provider

- `SolapiProvider` (SOLAPI)
- `IWINVProvider` (IWINV AlimTalk + optional SMS v2)
- `AligoProvider` (Aligo)

모든 provider는 `@k-msg/core`의 `Provider` 인터페이스를 구현합니다:

- `supportedTypes`: 지원하는 메시지 `type` 선언
- `send(options: SendOptions)`: `Result<SendResult, KMsgError>` 반환 (throw 하지 않음)

import 경로:

- `@k-msg/provider`: 런타임 중립 export (`IWINVProvider`, `AligoProvider`, 온보딩 헬퍼, mock)
- `@k-msg/provider/aligo`: Aligo provider export
- `@k-msg/provider/solapi`: SOLAPI provider export

## Provider 온보딩 매트릭스

단일 소스: `packages/provider/src/onboarding/specs.ts`

| Provider | 채널 온보딩 | 템플릿 API | plusId 정책 | plusId 추론 | 라이브 테스트 지원 |
| --- | --- | --- | --- | --- | --- |
| `iwinv` | 수동(콘솔) | 가능 | optional | unsupported | supported |
| `aligo` | API | 가능 | required_if_no_inference | supported | supported |
| `solapi` | 없음(벤더 메타 의존) | 미지원 | required_if_no_inference | unsupported | partial |
| `mock` | API(테스트용) | 가능 | optional | supported | none |

런타임 접근:

- 각 built-in provider는 `getOnboardingSpec()`를 노출합니다.
- 레지스트리 헬퍼: `getProviderOnboardingSpec`, `listProviderOnboardingSpecs`, `providerOnboardingSpecs`.

## ALIMTALK failover 책임 범위

ALIMTALK의 `failover`는 `@k-msg/core`에서 표준화되어 있지만 provider별 native 매핑은 다릅니다.

| Provider | Native mapping | Warning |
| --- | --- | --- |
| `iwinv` | `reSend`, `resendType`, `resendContent`, `resendTitle` | none (native로 처리) |
| `solapi` | `kakao.disableSms`, `text`, `subject` | `FAILOVER_PARTIAL_PROVIDER` |
| `aligo` | `failover`, `fmessage_1`, `fsubject_1` | `FAILOVER_PARTIAL_PROVIDER` |
| `mock` | native 매핑 없음 | `FAILOVER_UNSUPPORTED_PROVIDER` |

경계:

- provider 패키지는 벤더 native 필드로 매핑하고 warning 메타데이터를 반환합니다.
- tracking 기반 API 레벨 fallback retry(배달 폴링 + SMS/LMS 재발송)는 `@k-msg/messaging`에서 처리합니다.

## 사용 예시 (KMsg와 함께)

```ts
import { KMsg } from "@k-msg/messaging";
import { IWINVProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";

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
      smsSenderNumber: "01000000000",
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: { ALIMTALK: "iwinv" },
  },
});

await kmsg.send({ to: "01012345678", text: "hello" });
```

## Provider README 템플릿

새 provider를 추가할 때는 `packages/provider/PROVIDER_README_TEMPLATE.md`를 시작점으로 사용하고, 벤더 공식 문서 링크를 포함하세요.
