---
title: "사례: K-OTP"
description: "실서비스 휴대폰 인증 API인 K-OTP가 k-msg를 쓰는 방식: 알림톡 우선 발송과 SMS 대체 발송, 결과를 알 수 없는 발송의 안전한 처리, 전송 추적, WebOTP에 맞춘 SMS"
---

[K-OTP](https://k-otp.dev)는 한국 사용자를 대상으로 하는 앱을 위한 휴대폰 인증(OTP) API입니다. 일회용 코드를 발급하고 전달하고 검증하며, 모든 메시지를 k-msg로 보냅니다. K-OTP는 k-msg 메인테이너가 만들고 있어서, k-msg의 IWINV 프로바이더와 오류 정보, 전송 추적 스토어가 실제 운영 환경에서 쓰이는 곳이기도 합니다.

이 페이지는 K-OTP가 k-msg의 어떤 기능을 어떤 패턴으로 쓰는지 설명합니다. K-OTP API 자체는 [K-OTP 문서](https://docs.k-otp.dev)를 참고하세요.

## K-OTP가 호출자에게 약속하는 것

[K-OTP 문서](https://docs.k-otp.dev)에 따르면:

- 코드는 기본적으로 카카오 알림톡으로 나가고, SMS 대체 발송이 기본으로 켜져 있습니다. 요청마다 `smsFallback: false`로 끌 수 있습니다.
- 모든 발급 요청에는 멱등성 키가 있습니다. 같은 키로 재시도하면 메시지가 두 번 나가지 않습니다.
- 프로바이더 결과를 알 수 없으면 K-OTP는 이를 ambiguous로 기록하고 스스로 다시 보내지 않습니다. 호출자가 같은 키로 재시도합니다.
- 전송 상태는 비동기로 추적되며, Android Chrome에서는 SMS로 받은 코드를 자동으로 채울 수 있습니다(WebOTP).

약속마다 대응하는 k-msg 기능이 있습니다.

| 필요한 것 | k-msg 기능 |
| --- | --- |
| 한 프로바이더로 알림톡과 SMS 발송 | `@k-msg/provider/iwinv/send`의 `IWINVSendProvider` |
| 알림톡이 전달되지 않으면 SMS로 대체 | `ALIMTALK` 발송의 `failover` (IWINV `reSend`) |
| 타임아웃과 취소 | 프로바이더 요청 컨텍스트의 호출 단위 `signal`(과 `fetch`) |
| 재시도 판단 | `normalizeProviderError`와 `parseErrorRetryPolicyFromJson`으로 읽은 정책 |
| "보내졌을 수도 있는가?" | `KMsgError`의 `httpStatus`, `providerErrorCode`, `providerErrorText`, 그리고 `getIWINVSendErrorReason` |
| 상태 조회 | `provider.getDeliveryStatus()`와 `@k-msg/core`의 전송 상태 헬퍼 |
| 전송 기록 | 필드 암호화를 켠 `createDrizzleDeliveryTrackingStore` |
| 마이그레이션으로 관리하는 스키마 | `renderDrizzleSchemaSource`와 `initializeSchema: false` |

K-OTP는 자체 큐와 재시도, 라우팅을 이미 갖고 있어서 `KMsg`를 거치지 않고 프로바이더를 직접 호출합니다. 그런 구성이 없다면 `KMsg`부터 시작하세요. 같은 프로바이더 위에 라우팅, 기본값, 대체 문자 처리를 더해 줍니다.

## 1. 알림톡 우선, SMS 대체 발송

OTP 발송은 `failover`를 설정한 `ALIMTALK` 메시지입니다. IWINV에서는 k-msg가 `failover`를 IWINV 자체 재발송(`reSend`)으로 매핑하므로, 알림톡을 전달할 수 없을 때(예: 수신자가 카카오톡을 쓰지 않을 때) IWINV가 `fallbackContent`를 SMS로 보냅니다.

```ts
import { IWINVSendProvider } from "@k-msg/provider/iwinv/send";

const provider = new IWINVSendProvider({
  apiKey: env.IWINV_API_KEY, // 알림톡
  smsApiKey: env.IWINV_SMS_API_KEY, // SMS/LMS
  smsAuthKey: env.IWINV_SMS_AUTH_KEY,
  smsCompanyId: env.IWINV_SMS_COMPANY_ID, // SMS 상태 조회
  senderNumber: "01000000000",
  smsSenderNumber: "01000000000",
});

const code = "123456";
const smsText = `[예시] 인증번호는 ${code}입니다.`;

const result = await provider.send(
  {
    type: "ALIMTALK",
    messageId: "0192f1c2-7a4e-7cc1-9a51-3f6f0b9d2e10", // 메시지마다 고정된 id
    to: "01012345678",
    templateId: "OTP_CODE",
    variables: { code },
    failover: {
      enabled: true, // 호출자가 SMS 대체 발송을 끈 경우 false
      fallbackChannel: "sms",
      fallbackContent: smsText,
    },
  },
  { signal: AbortSignal.timeout(10_000) },
);
```

IWINV는 접수한 메시지만 재발송합니다. IWINV가 알림톡 요청을 곧바로 거절하면 재발송은 시작되지 않습니다. K-OTP는 이 경우를 직접 처리합니다. 오류가 메시지가 나가지 않았음을 증명하면(다음 절 참고) 같은 대체 문자를 담은 일반 `SMS` 메시지로 전환합니다. 결과를 알 수 없는 경우에는 절대 이렇게 하지 않으므로, 대체 SMS가 알림톡이나 IWINV 자체 재발송과 겹치지 않습니다.

여기서 중요한 점이 두 가지 있습니다.

- 대체 발송을 끄려면 `failover: { enabled: false }`를 넘기세요. `failover`를 생략하면 IWINV 프로바이더는 발신번호가 설정되어 있을 때 IWINV에 재발송을 요청합니다. K-OTP는 `enabled`를 항상 명시하므로 `smsFallback: false`는 정말로 SMS를 보내지 않습니다.
- 재발송은 기본적으로 발신번호로 나갑니다. SMS를 알림톡과 다른 번호로 보내야 하면 `providerOptions.resendCallback`으로 넘기세요.

## 2. 재시도할지, 대체 발송할지, 멈출지

실패한 발송은 `KMsgError`를 돌려줍니다. IWINV 발송 오류에는 정규화된 `code` 외에도 HTTP 상태, IWINV 자체 결과 코드와 메시지, 그리고 IWINV가 거절 이유를 밝힌 경우 그 이유가 담깁니다(IWINV 프로바이더 README의 [발송 오류](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/README_ko.md#발송-오류) 참고).

K-OTP는 오류마다 두 가지를 묻습니다.

1. **재시도할 가치가 있는가?** `normalizeProviderError`가 `classification`으로 답합니다. 재시도 정책은 설정에서 `parseErrorRetryPolicyFromJson`으로 읽습니다.
2. **그래도 메시지가 나갔을 수 있는가?** 자동 재시도나 대체 발송이 안전한지가 여기서 갈립니다. k-msg는 결과 코드 없는 2xx 응답을 `PROVIDER_ERROR`로 보고합니다. IWINV가 메시지를 접수했을 수도 있기 때문입니다. K-OTP는 이 경우와 타임아웃, 네트워크 오류, 5xx 응답을 *결과를 알 수 없음*으로 다룹니다.

이 판단을 단순화하면 다음과 같습니다.

```ts
import {
  type KMsgError,
  KMsgErrorCode,
  normalizeProviderError,
  parseErrorRetryPolicyFromJson,
} from "@k-msg/core";
import { getIWINVSendErrorReason } from "@k-msg/provider/iwinv/send";

const policy = parseErrorRetryPolicyFromJson(env.ERROR_RETRY_POLICY_JSON, {
  mode: "compat",
});

const UNKNOWN_OUTCOME_CODES = new Set<string>([
  KMsgErrorCode.NETWORK_ERROR,
  KMsgErrorCode.NETWORK_TIMEOUT,
  KMsgErrorCode.NETWORK_SERVICE_UNAVAILABLE,
  KMsgErrorCode.REQUEST_ABORTED,
  KMsgErrorCode.PROVIDER_ERROR,
  KMsgErrorCode.UNKNOWN_ERROR,
]);

function classify(error: KMsgError) {
  const normalized = normalizeProviderError(error, {
    mode: "compat",
    policy: policy ?? undefined,
  });
  const retryable = normalized.classification === "retryable";
  const status = normalized.httpStatus;

  // 프로바이더가 메시지를 접수했을 수 있음: 다시 보내거나 대체 발송하지 않는다.
  if (status !== undefined && (status >= 500 || status === 408 || status === 425)) {
    return { retryable, certainty: "unknown" as const };
  }
  // 2xx 응답은 결과 코드나 거절 이유가 있을 때만 거절이다.
  const namedRefusal = getIWINVSendErrorReason(error) !== undefined;
  if (
    status !== undefined &&
    status >= 200 &&
    status < 300 &&
    normalized.providerErrorCode === undefined &&
    !namedRefusal
  ) {
    return { retryable, certainty: "unknown" as const };
  }
  if (UNKNOWN_OUTCOME_CODES.has(normalized.code)) {
    return { retryable, certainty: "unknown" as const };
  }
  return { retryable, certainty: "not_sent" as const };
}
```

- `not_sent`이고 재시도 가능: 같은 메시지로 나중에 재시도합니다.
- `not_sent`이고 재시도 불가, 대체 발송을 켠 알림톡: SMS 대체 발송을 보냅니다(1절).
- `unknown`: 멈춥니다. K-OTP는 발급을 ambiguous로 표시하고 재시도 여부를 호출자에게 맡깁니다. 호출자는 같은 멱등성 키를 다시 씁니다.

k-msg는 발송을 중복 제거하지 않으므로 멱등성은 애플리케이션이 책임집니다. K-OTP는 메시지마다 고정된 `messageId`를 하나 부여합니다. 프로바이더가 이 값을 `SendResult.messageId`로 돌려주고 전송 기록의 키로도 쓰이므로, 재시도와 상태 갱신, 조회가 모두 같은 메시지를 가리킵니다.

`providerErrorText`는 IWINV가 쓴 문구라 보낸 내용을 그대로 담을 수 있습니다. K-OTP는 이를 로그에 남기거나 저장하기 전에 마스킹합니다.

## 3. 전송 추적과 폴링

K-OTP는 k-msg의 Drizzle 추적 스토어로 메시지마다 전송 기록 하나를 SQL 데이터베이스에 남기고, 수신번호와 발신번호는 암호화와 해시를 적용해 저장합니다.

```ts
import { createAesGcmFieldCryptoProvider } from "@k-msg/core";
import {
  createDrizzleDeliveryTrackingStore,
  renderDrizzleSchemaSource,
} from "@k-msg/messaging/adapters/cloudflare";

const fieldCryptoSchema = {
  enabled: true,
  mode: "secure",
  compatPlainColumns: false,
} as const;

const trackingStore = createDrizzleDeliveryTrackingStore({
  dialect: "postgres", // 또는 "mysql" / "sqlite"
  db, // 사용하는 Drizzle 데이터베이스
  fieldCryptoSchema,
  fieldCrypto: {
    config: {
      enabled: true,
      failMode: "closed",
      fields: { to: "encrypt+hash", from: "encrypt+hash", metadata: "encrypt" },
      provider: createAesGcmFieldCryptoProvider({ keys, hashKeys, activeKid: "v1" }),
    },
  },
  initializeSchema: false, // 테이블은 마이그레이션이 관리
});

// 빌드 시점에 같은 옵션으로 마이그레이션용 Drizzle 스키마를 만든다.
const schemaSource = renderDrizzleSchemaSource({
  dialect: "postgres",
  target: "tracking",
  fieldCryptoSchema,
});
```

- 스토어는 런타임에 테이블을 만들지 않습니다. K-OTP는 `renderDrizzleSchemaSource`로 Drizzle 스키마를 만들어 마이그레이션 옆에 커밋하고, 커밋된 스키마가 k-msg가 만드는 스키마와 달라지면 검사가 실패합니다.
- 전화번호는 암호화해 저장하고, 조회에는 키 기반 해시를 쓰며, 평문 컬럼은 두지 않습니다(`compatPlainColumns: false`). `failMode: "closed"`이므로 암호화에 실패하면 평문을 저장하는 대신 쓰기가 실패합니다.
- 키 로테이션은 [키 관리와 로테이션](/guides/security/key-management-rotation/)에서 설명하는 `kid` 지원을 씁니다.

최종 상태가 아닌 메시지는 `getDeliveryStatus`로 다시 조회합니다. K-OTP는 SMS 조회에 이를 쓰고(알림톡 조회는 자체 일괄 이력 조회를 씁니다), 최종 상태가 되면 멈춥니다.

```ts
import { isTerminalDeliveryStatus } from "@k-msg/core";

const status = await provider.getDeliveryStatus(
  {
    providerMessageId: "123456789",
    type: "SMS",
    to: "01012345678",
    requestedAt: new Date(),
  },
  { signal: AbortSignal.timeout(5_000) },
);

if (status.isSuccess && status.value && isTerminalDeliveryStatus(status.value.status)) {
  // DELIVERED, FAILED, CANCELLED, UNKNOWN: 이 메시지의 폴링을 멈춘다.
}
```

K-OTP는 이 작업에 자체 스케줄러를 씁니다. 스케줄러가 없다면 `@k-msg/messaging`의 `DeliveryTrackingService`가 스토어와 프로바이더를 대신 폴링합니다.

## 4. 90바이트 안에 맞춘 WebOTP SMS

Android Chrome은 코드가 SMS로 오고 메시지가 `@example.com #123456` 같은 출처 연결 줄로 끝날 때만 코드를 자동으로 채웁니다(WebOTP). 국내 SMS는 90바이트이며, ASCII 문자는 1바이트, 한글 같은 그 밖의 문자는 2바이트로 셉니다. 더 긴 문자는 LMS로 나갑니다.

K-OTP는 전체 문자가 SMS 한 건에 들어갈 때만 WebOTP 줄을 붙입니다. 들어가지 않으면 줄 없이 원래 문자를 보내므로, WebOTP 때문에 SMS가 LMS로 바뀌는 일은 없습니다. 알림톡에서는 SMS 대체 문자에만 이 줄을 붙일 수 있습니다.

```ts
import { estimateSmsBytes } from "k-msg";

const SMS_MAX_BYTES = 90;

function withWebOtpLine(body: string, host: string, otp: string): string {
  const candidate = `${body.trimEnd()}\n\n@${host} #${otp}`;
  // 줄바꿈이 CRLF로 나갈 수 있으므로 줄바꿈마다 1바이트를 더 센다.
  const bytes = estimateSmsBytes(candidate) + (candidate.match(/\n/g)?.length ?? 0);
  return bytes <= SMS_MAX_BYTES ? candidate : body;
}
```

`estimateSmsBytes`는 `KMsg`가 SMS와 LMS를 고를 때(`defaults.sms.autoLmsBytes`, 기본 90)와 같은 방식으로 셉니다. 알림톡 대체 발송에서도 IWINV가 `fallbackContent` 길이로 SMS와 LMS를 고르므로, 같은 한도를 지키면 대체 문자도 SMS 한 건으로 나갑니다.

## 런타임

K-OTP는 이 구성 요소를 Workers 호환 엣지 런타임에서 실행합니다. IWINV 프로바이더는 `fetch`로만 IWINV와 통신하고, 호출 단위 `signal`과 `fetch`를 모든 요청에 전달합니다. 바로 실행해 볼 수 있는 Workers 구성은 [예제 가이드](/guides/examples/)를 참고하세요.

## 관련 가이드

- [OTP 인증 메시지](/guides/use-cases/otp-verification/): 기본 OTP 흐름
- [Provider 패키지](/guides/packages/provider/): IWINV failover 매핑, transport context, 전송 결과 조회
- [Messaging 패키지](/guides/packages/messaging/): 대체 문자, 전송 추적, 스키마 유틸
- [Core 패키지](/guides/packages/core/): `KMsgError`와 Result 패턴
- [Field Crypto v1](/guides/security/field-crypto-v1/), [보안 레시피](/guides/security/recipes/)
