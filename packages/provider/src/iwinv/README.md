# IWINV Provider (English)

K-Message IWINV provider with unified send API for:
- AlimTalk
- SMS / LMS / MMS

Configure either channel alone or both: AlimTalk needs `apiKey`, and
SMS / LMS / MMS need `smsApiKey` and `smsAuthKey`.

For Korean documentation, see `README_ko.md`.

## Install

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

## Official IWINV Docs (Source)

- SMS API: https://help.iwinv.kr/manual/read.html?idx=904
- Kakao (AlimTalk) API: https://help.iwinv.kr/manual/862

## Onboarding Requirements

- Channel onboarding: manual in IWINV console (API is not exposed for channel add/auth in current integration).
- Template lifecycle: available via API (`createTemplate`, `updateTemplate`, `deleteTemplate`, `getTemplate`, `listTemplates`).
- `plusId`: optional for IWINV policy in `k-msg` onboarding spec.

For CLI:

- `k-msg providers doctor` and `k-msg alimtalk preflight` include the manual check id
  `channel_registered_in_console`.
- Keep an evidence record for this step in `k-msg.config.json` under
  `onboarding.manualChecks.iwinv`.
- That record is not a CLI-managed approval state; it is a note/evidence trail for
  the external IWINV console prerequisite.

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

Template variables:
- IWINV's `templateParam` is positional: one value per `#{placeholder}` occurrence, in template order.
- `IWINVProvider` builds it from `variables` by name. It reads the template body from
  `providerOptions.templateContent`, or else looks it up with the template list API
  (`POST /api/template/`) and keeps it for 10 minutes per provider instance.
- A placeholder with no matching key in `variables` fails the send with `INVALID_REQUEST`
  before anything is sent. `providerOptions.templateParam` (an array) is still sent as-is.
- With empty `variables` and no `templateContent` there is nothing to place, so no lookup is
  made; IWINV itself refuses a template that needs values (code `508`).

Fallback SMS/LMS (`reSend`):
- `failover.fallbackContent` (or `providerOptions.resendContent`) is sent as `resendContent`
  with `resendType: "N"`, IWINV's direct-input type. `failover.fallbackTitle` becomes
  `resendTitle`, the LMS title.
- Without fallback content, `resendType` is left to IWINV's default `"Y"`, which resends
  the AlimTalk text.
- IWINV sends the fallback as SMS (up to 90 bytes) or LMS by its length, so
  `failover.fallbackChannel` has no IWINV field.

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
- MMS image input is `options.media.image.bytes` or `options.media.image.blob` only.
- `media.image.ref` and `imageUrl` are rejected with `INVALID_REQUEST` (`caller must provide blob/bytes`).

### 3) SMS History / Charge (v2)

- History URL: `POST https://sms.bizservice.iwinv.kr/api/history/`
  - Header: `secret: base64(SMS_API_KEY&SMS_AUTH_KEY)`
  - Body requires `version`, `companyid`, `startDate`, `endDate`
  - Date window must be within 90 days
- Charge URL: `POST https://sms.bizservice.iwinv.kr/api/charge/`
  - Header: `secret: base64(SMS_API_KEY&SMS_AUTH_KEY)`
  - Body: `{"version":"1.0"}`

Note:
- `IWINVProvider` supports `getBalance(query?)`.
  - default channel: `ALIMTALK` (uses AlimTalk charge API), or `SMS` when `apiKey` is not set
  - `SMS/LMS/MMS`: uses SMS v2 charge API (`secret` auth)
- History endpoint remains documented here for reference.

## Environment Variables

Required for AlimTalk:

```bash
IWINV_API_KEY=your_alimtalk_api_key
```

Required for SMS/LMS/MMS v2 (enough on their own for SMS-only use):

```bash
IWINV_SMS_API_KEY=your_sms_api_key
IWINV_SMS_AUTH_KEY=your_sms_auth_key
```

Optional sender defaults:

```bash
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
    // Example: inject custom headers (use with care).
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

// AlimTalk: variables are matched to the template's #{name} placeholders.
const alimtalk = await provider.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "YOUR_TEMPLATE_CODE",
  variables: { name: "Jane" },
  // Optional: set `from` to enable SMS fallback (IWINV's `reSend` flow).
  from: "01000000000",
});
if (alimtalk.isFailure) throw alimtalk.error;

// SMS/LMS/MMS only: no AlimTalk apiKey needed.
const smsOnly = new IWINVProvider({
  smsApiKey: process.env.IWINV_SMS_API_KEY!,
  smsAuthKey: process.env.IWINV_SMS_AUTH_KEY!,
  smsSenderNumber: process.env.IWINV_SMS_SENDER_NUMBER,
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
