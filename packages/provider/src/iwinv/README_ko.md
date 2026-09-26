# IWINV Provider (한국어)

K-Message IWINV 프로바이더는 하나의 `send` API로 아래 채널을 통합 처리합니다.
- 알림톡
- SMS / LMS / MMS

한 채널만 설정해도 됩니다. 알림톡은 `apiKey`, SMS / LMS / MMS는 `smsApiKey`와
`smsAuthKey`가 필요합니다.

영문 문서는 `README.md`를 참고하세요.

## 설치

```bash
npm install @k-msg/provider @k-msg/core
# 또는
bun add @k-msg/provider @k-msg/core
```

## 공식 문서(IWINV) 링크

- SMS API: https://help.iwinv.kr/manual/read.html?idx=904
- 알림톡(Kakao) API: https://help.iwinv.kr/manual/862

## 온보딩 요구사항

- 채널 온보딩: 현재 통합에서는 IWINV 콘솔에서 수동 처리(채널 add/auth API 미노출).
- 템플릿 라이프사이클: API 지원(`createTemplate`, `updateTemplate`, `deleteTemplate`, `getTemplate`, `listTemplates`).
- `plusId`: `k-msg` 온보딩 정책에서 iwinv는 optional.

CLI 기준:

- `k-msg providers doctor`, `k-msg alimtalk preflight`에서
  `channel_registered_in_console` manual 체크를 평가합니다.
- 이 단계의 증빙/메모는 `k-msg.config.json`의 `onboarding.manualChecks.iwinv`에 유지하세요.
- 이 값은 CLI가 관리하는 approval state가 아니라, 외부 IWINV 콘솔 prerequisite에 대한 note/evidence입니다.

## 채널별 엔드포인트 / 헤더

### 1) 알림톡 (v2)

- URL: `POST https://alimtalk.bizservice.iwinv.kr/api/v2/send/`
- 헤더:
  - `Content-Type: application/json;charset=UTF-8`
  - `AUTH: base64(API_KEY)`
- BODY:
  - 필수: `templateCode`, `list[]`
  - 자주 쓰는 옵션: `reserve`, `sendDate`, `reSend`, `resendCallback`, `resendType`, `resendTitle`, `resendContent`
- 응답 예:
  - 성공: `{"code":200,...}`
  - IP 미등록: `{"code":206,"message":"등록하지 않은 IP에서는 발송되지 않습니다."}`

템플릿 변수:
- IWINV의 `templateParam`은 위치 기반 배열이지만, IWINV 규격서에는 위치와 변수의 대응이 나와 있지 않습니다.
  `IWINVProvider`는 서로 다른 `#{이름}`마다 값 하나를, 템플릿 내용과 버튼 링크에서 그 이름이 처음 나오는
  순서대로 보냅니다(IWINV 매뉴얼 예시는 한 버튼의 두 링크에 같은 `#{idx}`를 씁니다). IWINV 콘솔이 변수마다
  값 하나를 받는 방식이며, 이전 버전이 `variables`의 키를 템플릿 순서로 적었을 때 보내던 형태와 같습니다.
- 값은 `variables`에서 이름으로 찾습니다. 템플릿 본문은 `providerOptions.templateContent`(변수가 있는 버튼
  링크도 포함)에서 읽고, 없으면 템플릿 목록 API(`POST /api/template/`)로 조회해 provider 인스턴스마다
  10분간 재사용합니다.
- `variables`에 값이 없는 변수(키가 없거나 `undefined`)가 있으면 아무것도 보내지 않고 `INVALID_REQUEST`로
  실패합니다. 순서가 다른 템플릿은 `providerOptions.templateParam`(배열)을 주면 그대로 보냅니다.
- `variables`가 비어 있고 `templateContent`도 없으면 채울 값이 없으므로 조회하지 않습니다. 값이 필요한
  템플릿은 IWINV가 거부합니다(코드 `508`).

대체문자(`reSend`):
- `failover.fallbackContent`(또는 `providerOptions.resendContent`)는 IWINV의 직접 입력 타입인
  `resendType: "N"`과 함께 `resendContent`로 보냅니다. `failover.fallbackTitle`은 LMS 제목인
  `resendTitle`이 됩니다.
- 대체문자 내용이 없으면 `resendType`을 보내지 않아 IWINV 기본값 `"Y"`(알림톡 내용 재발송)가 적용됩니다.
- IWINV는 내용 길이에 따라 SMS(90바이트 이하) 또는 LMS로 보내므로 `failover.fallbackChannel`에
  대응하는 IWINV 필드는 없습니다.

알림톡 `code` 요약:
- `200`: 발송 성공
- `501`: `templateCode` 오류
- `505`: 사전 등록되지 않은 발신번호
- `508`: `templateParam` 필수
- `519`: 잔액 부족
- `540`: 금칙어 포함

### 2) SMS / LMS / MMS (v2)

- URL: `POST https://sms.bizservice.iwinv.kr/api/v2/send/`
- 헤더:
  - `Content-Type: application/json;charset=UTF-8`
  - `secret: base64(SMS_API_KEY&SMS_AUTH_KEY)`
- BODY(SMS 예시):
  - `version`, `from`, `to[]`, `text`, (옵션)`date`, (옵션)`msgType`
- 응답 예:
  - `{"resultCode":0,"message":"전송 성공","requestNo":"...","msgType":"SMS"}`

중요:
- SMS v2는 실제 검증에서 소문자 `secret` 헤더로 정상 동작했습니다.
- IP 화이트리스트가 걸려 있으면 실제 egress IP를 반드시 등록해야 합니다.
- MMS 이미지 입력은 `options.media.image.bytes` 또는 `options.media.image.blob`만 지원합니다.
- `media.image.ref`, `imageUrl` 입력은 `INVALID_REQUEST`(`caller must provide blob/bytes`)로 실패합니다.

### 3) SMS 전송내역/잔액 조회 (v2)

- 전송내역 URL: `POST https://sms.bizservice.iwinv.kr/api/history/`
  - 헤더: `secret: base64(SMS_API_KEY&SMS_AUTH_KEY)`
  - BODY 필수: `version`, `companyid`, `startDate`, `endDate`
  - 조회 기간은 90일 이내만 허용
- 잔액 URL: `POST https://sms.bizservice.iwinv.kr/api/charge/`
  - 헤더: `secret: base64(SMS_API_KEY&SMS_AUTH_KEY)`
  - BODY: `{"version":"1.0"}`

참고:
- `IWINVProvider`는 `getBalance(query?)`를 지원합니다.
  - 기본 채널: `ALIMTALK` (알림톡 charge API 사용), `apiKey`가 없으면 `SMS`
  - `SMS/LMS/MMS`: SMS v2 charge API(`secret` 인증) 사용
- 전송내역(history) 엔드포인트는 참고용 문서로 유지됩니다.

## 환경변수

알림톡 사용 시 필수:

```bash
IWINV_API_KEY=your_alimtalk_api_key
```

SMS/LMS/MMS v2 사용 시 필수(SMS만 쓸 때는 이 두 값만 있으면 됩니다):

```bash
IWINV_SMS_API_KEY=your_sms_api_key
IWINV_SMS_AUTH_KEY=your_sms_auth_key
```

발신번호 기본값(선택):

```bash
IWINV_SENDER_NUMBER=01000000000
```

안정화 옵션:

```bash
IWINV_SEND_ENDPOINT=/api/v2/send/
IWINV_IP_RETRY_COUNT=2
IWINV_IP_RETRY_DELAY_MS=800
IWINV_IP_ALERT_WEBHOOK_URL=https://your-alert-webhook
```

프록시/IP 우회(테스트 / 통제된 환경에서만):

```bash
# IWINV 요청(알림톡 + SMS v2)에 X-Forwarded-For 헤더를 추가합니다.
IWINV_X_FORWARDED_FOR=1.1.1.1
```

## TypeScript 사용 예시

```typescript
import { IWINVProvider } from "@k-msg/provider/iwinv";

const provider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
  smsApiKey: process.env.IWINV_SMS_API_KEY,
  smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
  senderNumber: process.env.IWINV_SENDER_NUMBER,
  smsSenderNumber: process.env.IWINV_SMS_SENDER_NUMBER,
  sendEndpoint: "/api/v2/send/",
  xForwardedFor: process.env.IWINV_X_FORWARDED_FOR,
  extraHeaders: {
    // 예: 커스텀 헤더 주입(주의: AUTH/secret을 덮어쓰면 실패할 수 있습니다)
    // "X-Custom": "value",
  },
});

// SMS
const sms = await provider.send({
  type: "SMS",
  to: "01012345678",
  from: "01000000000",
  text: "hello",
});
if (sms.isFailure) throw sms.error;

// 알림톡: variables는 템플릿의 #{이름} 변수에 이름으로 매칭됩니다.
const alimtalk = await provider.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "YOUR_TEMPLATE_CODE",
  variables: { name: "Jane" },
  // 선택: `from`을 주면 IWINV의 대체문자(reSend) 플로우가 활성화됩니다.
  from: "01000000000",
});
if (alimtalk.isFailure) throw alimtalk.error;

// SMS/LMS/MMS 전용: 알림톡 apiKey 없이 사용할 수 있습니다.
const smsOnly = new IWINVProvider({
  smsApiKey: process.env.IWINV_SMS_API_KEY!,
  smsAuthKey: process.env.IWINV_SMS_AUTH_KEY!,
  smsSenderNumber: process.env.IWINV_SMS_SENDER_NUMBER,
});
```

## CLI 사용 예시

`apps/cli` 기준:

```bash
# SMS
bun src/cli.ts send \
  --provider iwinv \
  -c SMS \
  -p 01012345678 \
  --sender 01000000000 \
  --text "test message"

# 알림톡
bun src/cli.ts send \
  --provider iwinv \
  -c ALIMTALK \
  -p 01012345678 \
  -t YOUR_TEMPLATE_CODE
```

## SMS resultCode 요약

- `0`: 전송 성공
- `14`: 인증 요청 오류(키 조합/헤더 인코딩 문제)
- `15`: 미등록 IP
- `13`: 미등록 발신번호
- `41`: 수신번호 누락
- `50`: 자동충전 한도 초과

## 트러블슈팅

- `resultCode=14` (SMS): `SMS_API_KEY` + `SMS_AUTH_KEY` 조합과 `secret` 인코딩 형식을 확인하세요.
- `resultCode=15` 또는 알림톡 `code=206`: 현재 실행 환경의 공인 IP를 IWINV에 화이트리스트 등록하세요.
- 알림톡 `code=505`: IWINV 콘솔에서 발신번호 등록/승인 상태를 먼저 확인하세요.
- `13` 발신번호 오류: 해당 채널 콘솔에서 발신번호 승인 상태를 확인하세요.

## 라이선스

MIT
