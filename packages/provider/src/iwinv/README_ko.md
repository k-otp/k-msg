# IWINV Provider (한국어)

K-Message IWINV 프로바이더는 하나의 `send` API로 아래 채널을 통합 처리합니다.
- 알림톡
- SMS / LMS / MMS

영문 문서는 `README.md`를 참고하세요.

## 설치

```bash
npm install @k-msg/provider @k-msg/core
# 또는
bun add @k-msg/provider @k-msg/core
```

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

## 환경변수

최소 필수:

```bash
# 알림톡
IWINV_API_KEY=your_alimtalk_api_key
IWINV_BASE_URL=https://alimtalk.bizservice.iwinv.kr

# SMS/LMS/MMS v2
IWINV_SMS_BASE_URL=https://sms.bizservice.iwinv.kr
IWINV_SMS_API_KEY=your_sms_api_key
IWINV_SMS_AUTH_KEY=your_sms_auth_key

# 공통 발신번호(선택)
IWINV_SENDER_NUMBER=01000000000
```

안정화 옵션:

```bash
IWINV_SEND_ENDPOINT=/api/v2/send/
IWINV_IP_RETRY_COUNT=2
IWINV_IP_RETRY_DELAY_MS=800
IWINV_IP_ALERT_WEBHOOK_URL=https://your-alert-webhook
```

## TypeScript 사용 예시

```typescript
import { IWINVProvider } from "@k-msg/provider";

const provider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: process.env.IWINV_BASE_URL ?? "https://alimtalk.bizservice.iwinv.kr",
  smsBaseUrl: process.env.IWINV_SMS_BASE_URL ?? "https://sms.bizservice.iwinv.kr",
  smsApiKey: process.env.IWINV_SMS_API_KEY,
  smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
  senderNumber: process.env.IWINV_SENDER_NUMBER,
  sendEndpoint: "/api/v2/send/",
});

// SMS
await provider.send({
  channel: "SMS",
  templateCode: "SMS_DIRECT",
  phoneNumber: "01012345678",
  text: "hello",
  variables: { message: "hello" },
  options: { senderNumber: "01000000000" },
});

// 알림톡
await provider.send({
  channel: "ALIMTALK",
  templateCode: "YOUR_TEMPLATE_CODE",
  phoneNumber: "01012345678",
  variables: { name: "Jane" },
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
