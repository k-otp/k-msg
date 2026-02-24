# k-msg

> 공식 문서: [k-msg.and.guide](https://k-msg.and.guide)

한국형 멀티채널 메시징 툴킷(프로바이더 주입 + 단일 `send()` UX).

최상위 사용 방식은 아래로 통일됩니다:

- `new KMsg({ providers, routing, defaults, hooks })`
- `kmsg.send({ type, ... })` (`type` 생략 시 기본 문자(SMS)로 처리)

## K-Message란?

K-Message는 한국형 멀티채널 메시징 플랫폼을 위한 TypeScript 라이브러리입니다.
SMS, LMS, 알림톡, 친구톡을 하나의 통합 API로 관리할 수 있습니다.

### 주요 특징

- **하나의 API로 다양한 채널 전송**: SMS, LMS, 알림톡, 친구톡 통합 관리
- **다중 프로바이더 지원**: SOLAPI, IWINV, Aligo 등 한국 주요 메시징 프로바이더 플러그인
- **TypeScript 네이티브**: 완벽한 타입 안전성과 IDE 자동완성 지원
- **Result 패턴**: 명시적 에러 처리로 안전한 비즈니스 로직 작성
- **Bun 최적화**: 현대적 JavaScript 런타임에 최적화된 성능

### 빠른 예제

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";

const kmsg = new KMsg({ providers: [new IWINVProvider({ apiKey: process.env.IWINV_API_KEY! })] });
await kmsg.send({ to: "01012345678", text: "안녕하세요!" });
```

### 언제 사용하나요?

- 한국 시장 대상 서비스에서 SMS/알림톡 발송이 필요할 때
- 여러 메시징 프로바이더를 사용 중이거나 전환을 계획 중일 때
- 타입 안전한 메시징 API를 원하는 TypeScript 프로젝트
- 고가용성을 위해 프로바이더 장애 시 자동 페일오버가 필요할 때

## 설치

```bash
npm install k-msg
# or
bun add k-msg
```

SOLAPI를 사용한다면 `solapi`를 별도로 설치하고 `@k-msg/provider/solapi`에서 import해야 합니다.

## 빠른 시작

```ts
import { KMsg } from "k-msg";
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
  templateId: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## ALIMTALK failover

알림톡은 표준 failover 옵션을 사용할 수 있습니다:

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",
  variables: { code: "123456" },
  failover: {
    enabled: true,
    fallbackChannel: "sms",
    fallbackContent: "대체 SMS 본문",
    fallbackTitle: "대체 제목(LMS)",
  },
});
```

프로바이더 native 매핑이 미지원/부분지원이면 아래 warning 코드가 반환됩니다:

- `FAILOVER_UNSUPPORTED_PROVIDER`
- `FAILOVER_PARTIAL_PROVIDER`

Delivery Tracking 기반 API 레벨 fallback은 아래 조건에서 SMS/LMS를 1회 재시도합니다:

- 메시지 타입이 `ALIMTALK`
- failover가 활성화됨
- 딜리버리 상태가 `FAILED`
- 실패 원인이 카카오 미사용자로 판별됨

## Field Crypto (Security Audit v1)

`@k-msg/core`, `@k-msg/messaging`, `@k-msg/webhook`은 `fieldCrypto` 기반 필드 단위 암호화 정책을 지원합니다.

- `FieldMode`: `plain | encrypt | encrypt+hash | mask`
- `fieldCrypto` 활성화 시 secure 기본값 적용
- 실패 정책 기본값은 `failMode: "closed"`
- 조회는 암호문이 아니라 해시(`to_hash`, `from_hash`) 기반

관련 문서:

- [`docs/security/field-crypto-basics_ko.md`](./docs/security/field-crypto-basics_ko.md)
- [`docs/security/field-crypto-v1.md`](./docs/security/field-crypto-v1.md)
- [`docs/security/key-rotation-playbook.md`](./docs/security/key-rotation-playbook.md)
- [`docs/security/migration-cli-runbook.md`](./docs/security/migration-cli-runbook.md)
- [`docs/security/crypto-control-signals.md`](./docs/security/crypto-control-signals.md)
- [`docs/migration/field-crypto-migration.md`](./docs/migration/field-crypto-migration.md)
- [`docs/compliance/kr-b2b-retention.md`](./docs/compliance/kr-b2b-retention.md)

보안 용어가 낯설다면 아래 순서로 먼저 읽는 것을 권장합니다:

- Astro docs(국문): [`/guides/security/glossary/`](https://k-msg.and.guide/guides/security/glossary/) -> [`/guides/security/recipes/`](https://k-msg.and.guide/guides/security/recipes/)
- Astro docs(영문): [`/en/guides/security/glossary/`](https://k-msg.and.guide/en/guides/security/glossary/) -> [`/en/guides/security/recipes/`](https://k-msg.and.guide/en/guides/security/recipes/)

## 프로젝트 로드맵

향후 개발 방향은 구현 상태 기반 로드맵을 기준으로 진행합니다:

- 영문 로드맵: [`ROADMAP.md`](./ROADMAP.md)
- 국문 로드맵: [`ROADMAP_ko.md`](./ROADMAP_ko.md)

로드맵은 운영 지표와 사용자 피드백을 반영해 분기별로 업데이트합니다.

## 패키지 구성

- `@k-msg/core`: 표준 타입/에러/Result/복원력 유틸(`Provider`, `SendOptions`, `Result`, `KMsgError`, ...)
- `@k-msg/messaging`: `KMsg` Facade(정규화 + 라우팅)
- `@k-msg/provider`: 기본 프로바이더(SOLAPI / IWINV / Aligo)
- `@k-msg/template`: 템플릿 치환 유틸
- `@k-msg/analytics`, `@k-msg/webhook`, `@k-msg/channel`: 선택 구성요소

## 의존성 운영 정책

- 본체 패키지/앱(`packages/*`, `apps/*`)은 안정성을 우선합니다.
- 예제 프로젝트(`examples/*`)는 별도 주기로 업그레이드합니다.
- 점검은 `bun run deps:outdated:core` / `bun run deps:outdated:examples`로 분리해 수행합니다.

## 릴리즈 운영

changeset/릴리즈 자동화 운영 정책은 아래 문서에 정리되어 있습니다:

- [`./.sampo/README.md`](./.sampo/README.md)
- [`./.sampo/README_ko.md`](./.sampo/README_ko.md)

## 브레이킹 변경사항

- Legacy `Platform` / `UniversalProvider` / `StandardRequest` 공개 API 제거
- 메시지 구분 필드는 `type`로 통일(기존 `channel` 제거)
- `templateCode` → `templateId`로 통일
