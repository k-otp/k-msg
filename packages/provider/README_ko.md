# @k-msg/provider

> 공식 문서: [k-msg.and.guide](https://k-msg.and.guide)

`k-msg`용 provider 구현 패키지입니다. (`SendOptions + Result` 기반)

## 설치

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

SOLAPI provider를 사용할 경우, 앱에서 최신 `solapi`를 별도로 설치하세요. `@k-msg/provider`는 현재 v6 라인과 이전 v5 peer 범위를 함께 지원합니다:

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
- `send(options: SendOptions, context?: ProviderRequestContext)`: `Result<SendResult, KMsgError>` 반환 (throw 하지 않음)
- 일부 provider는 선택 capability인 `getBalance(query?)`를 함께 구현합니다.

### 호출 단위 transport context

`ProviderRequestContext`로 `AbortSignal`과 호출 단위 `fetch` 구현을 전달할
수 있습니다. 기능에 의존하기 전에 `provider.transportCapabilities`를
확인해야 하며, capability 선언이 없으면 unsupported로 취급합니다.

| Provider | AbortSignal | Injectable fetch | 비고 |
| --- | --- | --- | --- |
| `iwinv` | supported | supported | `send`와 `getDeliveryStatus`의 모든 내부 요청에 context 전달 |
| `aligo` | supported | supported | 모든 send 채널이 공통 fetch transport 사용 |
| `solapi` | unsupported | unsupported | upstream SOLAPI SDK가 호출 단위 signal/fetch hook을 제공하지 않음 |
| `mock` | supported | unsupported | 모의 지연은 signal을 따르며 HTTP transport는 사용하지 않음 |

```ts
const controller = new AbortController();
const result = await provider.send(input, {
  signal: controller.signal,
  fetch: globalThis.fetch,
});
```

import 경로:

- `@k-msg/provider`: 런타임 중립 export (`IWINVProvider`, `AligoProvider`, 온보딩 헬퍼, mock)
- `@k-msg/provider/aligo`: Aligo provider export
- `@k-msg/provider/solapi`: SOLAPI provider export (`solapi`는 사용자 앱에서 직접 설치)

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

해석 기준:

- 여기서의 `채널 온보딩`은 vendor prerequisite path(`manual`, `api`, `none`)를 뜻하며, toolkit이 관리하는 approval state를 의미하지 않습니다.
- CLI가 `onboarding.manualChecks`를 저장하는 경우도 외부 벤더 절차에 대한 operator evidence/note를 기록하는 용도입니다.

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

## Provider 구현 구조 가이드

provider 코드 구조 표준(파사드 + 도메인 모듈 + shared 유틸 승격 기준)은 아래 문서를 참고하세요.

- `packages/provider/src/PROVIDER_STRUCTURE.md`
