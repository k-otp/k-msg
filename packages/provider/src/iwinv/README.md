# IWINV Provider (English)

K-Message IWINV provider with unified send API for:
- AlimTalk
- SMS / LMS / MMS

For Korean documentation, see `README_ko.md`.

## Install

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

## Channel Endpoints and Headers

### 1) AlimTalk (v2)

- URL: `POST https://alimtalk.bizservice.iwinv.kr/api/v2/send/`
- Headers:
  - `Content-Type: application/json;charset=UTF-8`
  - `AUTH: base64(API_KEY)`
- Body:
  - Required: `templateCode`, `list[]`
  - Common options: `reserve`, `sendDate`, `reSend`, `resendCallback`, `resendType`, `resendTitle`, `resendContent`
- Typical response shape:
  - `{"code":200,...}` on success
  - `{"code":206,"message":"등록하지 않은 IP에서는 발송되지 않습니다."}` when IP is not whitelisted

AlimTalk `code` quick reference:
- `200`: sent
- `501`: invalid `templateCode`
- `505`: sender number is not pre-registered
- `508`: `templateParam` required
- `519`: insufficient balance
- `540`: blocked keyword detected

### 2) SMS / LMS / MMS (v2)

- URL: `POST https://sms.bizservice.iwinv.kr/api/v2/send/`
- Headers:
  - `Content-Type: application/json;charset=UTF-8`
  - `secret: base64(SMS_API_KEY&SMS_AUTH_KEY)`
- Body (SMS example):
  - `version`, `from`, `to[]`, `text`, optional `date`, optional `msgType`
- Typical response shape:
  - `{"resultCode":0,"message":"전송 성공","requestNo":"...","msgType":"SMS"}`

Important:
- In our runtime verification, lowercase header key `secret` worked for SMS v2.
- If your service is IP-restricted, whitelist the real egress IP.

## Environment Variables

Minimum:

```bash
# AlimTalk
IWINV_API_KEY=your_alimtalk_api_key
IWINV_BASE_URL=https://alimtalk.bizservice.iwinv.kr

# SMS/LMS/MMS v2
IWINV_SMS_BASE_URL=https://sms.bizservice.iwinv.kr
IWINV_SMS_API_KEY=your_sms_api_key
IWINV_SMS_AUTH_KEY=your_sms_auth_key

# Optional common sender
IWINV_SENDER_NUMBER=01000000000
```

Optional reliability settings:

```bash
IWINV_SEND_ENDPOINT=/api/v2/send/
IWINV_IP_RETRY_COUNT=2
IWINV_IP_RETRY_DELAY_MS=800
IWINV_IP_ALERT_WEBHOOK_URL=https://your-alert-webhook
```

Optional proxy/IP override (testing / controlled environments):

```bash
# Adds X-Forwarded-For to IWINV requests (AlimTalk + SMS v2)
IWINV_X_FORWARDED_FOR=1.1.1.1
```

## TypeScript Usage

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
  xForwardedFor: process.env.IWINV_X_FORWARDED_FOR,
  extraHeaders: {
    // Example: inject custom headers (use with care).
    // "X-Custom": "value",
  },
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

// AlimTalk
await provider.send({
  channel: "ALIMTALK",
  templateCode: "YOUR_TEMPLATE_CODE",
  phoneNumber: "01012345678",
  variables: { name: "Jane" },
});
```

## CLI Usage

From `apps/cli`:

```bash
# SMS
bun src/cli.ts send \
  --provider iwinv \
  -c SMS \
  -p 01012345678 \
  --sender 01000000000 \
  --text "test message"

# AlimTalk
bun src/cli.ts send \
  --provider iwinv \
  -c ALIMTALK \
  -p 01012345678 \
  -t YOUR_TEMPLATE_CODE
```

## SMS resultCode Quick Reference

- `0`: success
- `14`: invalid authentication request (key pair/header mismatch)
- `15`: unregistered IP
- `13`: unregistered sender number
- `41`: missing recipient
- `50`: auto-recharge limit exceeded

## Troubleshooting

- `resultCode=14` (SMS): verify exact `SMS_API_KEY` + `SMS_AUTH_KEY` pair and `secret` header encoding format.
- `resultCode=15` or AlimTalk `code=206`: whitelist your real egress IP in IWINV.
- AlimTalk `code=505`: register/approve sender number first in IWINV console.
- Sender errors (`13`): ensure sender is approved in the relevant channel console.

## License

MIT
