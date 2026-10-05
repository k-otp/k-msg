# IWINV Provider (English)

K-Message IWINV provider with unified send API for:
- AlimTalk
- SMS / LMS / MMS
- RCS templates (`RCS_TPL`)

Configure any channel alone or together: AlimTalk needs `apiKey`,
SMS / LMS / MMS need `smsApiKey` and `smsAuthKey`, and RCS needs `rcsApiKey`.

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
- RCS: launch notice https://docs.iwinv.kr/blog/2026/06/15/release-rcs, setup guides
  under https://docs.iwinv.kr/service/message/rcs/rcs-guide (account, sending IPs,
  templates, sending). The RCS REST API guide itself is in the IWINV console
  (메시지 > RCS > RCS API) and needs a login; the RCS section below follows it as read
  on 2026-10-05.

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
- IWINV's `templateParam` is a positional array, and IWINV's spec does not say how positions map
  to placeholders. `IWINVProvider` sends one value per distinct `#{name}`, in the order the names
  first appear in the template content and then in its button links (IWINV's manual reuses one
  `#{idx}` in two links of a button). That is the one value per variable that IWINV's console
  asks for, and what earlier versions sent when `variables` listed its keys in template order.
- The values come from `variables` by name. The template text comes from
  `providerOptions.templateContent` (include any button links that have placeholders), or else
  from the template list API (`POST /api/template/`), kept for 10 minutes per provider instance.
- A placeholder without a value in `variables` (no key, or `undefined`) fails the send with
  `INVALID_REQUEST` before anything is sent. `providerOptions.templateParam` (an array) is sent
  as-is, for a template that needs a different order.
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

### 4) RCS (template messages)

IWINV offers RCS template messages only (its SMS/LMS/image RCS types are not
available yet), so `IWINVProvider` sends `RCS_TPL` and refuses the other `RCS_*`
types.

- URL: `POST https://rcs.bizservice.iwinv.kr/api/v1/send/`
- Headers:
  - `Content-Type: application/json;charset=UTF-8`
  - `AUTH: base64(RCS_API_KEY)`: the RCS account's own send API key ("RCS 발송 API
    Key"), separate from the AlimTalk and SMS keys.
- Body, from `SendOptions`:
  - `brandId`: `options.rcs.brandId`, else `config.rcsBrandId`.
  - `templateCode`: `options.rcs.templateId`, else `templateId`.
  - `callback` (sender number): `from`, else `config.rcsSenderNumber`, else
    `config.senderNumber`.
  - `list[0]`: `phone` and `templateParam`, an object of the template's
    variables by name, from `variables` and `options.rcs.variables` (values
    become strings; `null` is `""`, `undefined` is left out).
  - `reserve`/`sendDate`: `options.scheduledAt` (sent in KST). IWINV takes a
    time from 15 minutes up to 2 days ahead.
- Templates hold at most 90 characters including the variable values; IWINV
  refuses a longer message (`211`/`212`).

Fallback SMS/LMS (`reSend`): `failover` on `RCS_TPL` (`RcsFailoverOptions` in
`@k-msg/core`, the same shape as AlimTalk's) maps to IWINV's fields:

- `rcs.disableSms: true` or `failover.enabled: false` sends no fallback, which
  is also IWINV's default; `rcs.disableSms` wins over `failover.enabled: true`.
  Otherwise a fallback is requested (`reSend: "Y"`) when `failover.enabled` is
  true or `failover.fallbackContent` is given.
- `fallbackContent` is `resendContent`, `fallbackTitle` is `resendTitle` (LMS
  only), and `fallbackChannel` picks `resendType` `SMS` or `LMS`; without a
  channel the text's size decides (over 90 bytes, counted as `KMsg` counts
  them, is LMS). `KMsg` fills `#{name}` placeholders in the fallback text from
  `variables` before the send.
- Text over 90 bytes as SMS or 2,000 bytes as LMS fails with `INVALID_REQUEST`
  before anything is sent.
- `providerOptions.reSend`, `resendType`, `resendTitle` and `resendContent`
  take precedence over `failover`.
- With `failover.enabled` and no text, `reSend: "Y"` is sent without
  `resendContent`; IWINV's guide does not say what it then sends, so give the
  text when the fallback matters (for example, an OTP).

Message key and delivery status:

- IWINV's send answer is `{"code":200,"message":...,"success":n,"fail":n}` and
  carries no message key: `msgkey` appears only in the history API. A send
  therefore reports `providerMessageId` as `iwinv-rcs:<brandId>:<templateCode>`
  (URI-encoded), a correlation id rather than IWINV's key.
- `getDeliveryStatus({ type: "RCS_TPL", ... })` posts to
  `https://rcs.bizservice.iwinv.kr/api/v1/history/` with the recipient, brand,
  template and a window from a minute before `requestedAt` to five minutes
  after it (or after `scheduledAt`), reads every page (1,000 rows each, up to
  ten), and takes the API-sent row whose `req_date` is closest to
  `requestedAt` (or `scheduledAt`). Two sends of one template to one number within moments of
  each other cannot be told apart. The row (with IWINV's `msgkey`) is `raw`.
  A `providerMessageId` that is not a correlation id is looked up as IWINV's
  `msgkey`.
- Status: `state` 수신완료 is `DELIVERED`, 수신실패 `FAILED`, 대기 `PENDING`;
  otherwise `done_code` `10000` is `DELIVERED` and any other `done_code`
  `FAILED`. Only a row without a code is read by its `done_message` ("성공"
  is `DELIVERED`), and a row with neither is `SENT`. IWINV
  publishes no `done_code` table, so `statusCode` is IWINV's code as is. The
  status is the RCS message's; a fallback SMS/LMS is not reported.
- The history API's HTTP method is not stated in IWINV's guide; this provider
  posts JSON as for sends. RCS history, unlike SMS, needs no `companyid`.
- IWINV's scheduled-send cancel API (`/api/v1/cancel/`) is not wrapped, and
  `getBalance` has no RCS channel.

RCS `code` quick reference: `200` sent; `202` API key authentication failed;
`203` brand not approved; `206` IP not registered; `207` template not in the
brand; `208` template not approved; `209`–`212` variable or length errors;
`213` banned word; `214`/`215`/`221` recipient number missing or malformed;
`217`/`218` sender number not registered; `222` daily auto-charge limit;
`223` auto-charge in progress; `224` insufficient balance; `225` auto-charge
failed. See "Send Errors" for how they map.

Onboarding: IWINV's RCS setup is manual. Register a brand in RCS Biz Center,
delegate it to IWINV's agency, add the RCS account (RCS ID and brand key) in the
IWINV console, register the sending IPs and a sender number, and get the
template approved. `k-msg providers doctor` lists these as the manual checks
`rcs_brand_template_approved` and `rcs_send_ip_registered`.

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

Required for RCS (enough on its own for RCS-only use):

```bash
IWINV_RCS_API_KEY=your_rcs_send_api_key
IWINV_RCS_BRAND_ID=BR.your_brand_id         # optional default brand
IWINV_RCS_SENDER_NUMBER=15880000            # optional; falls back to IWINV_SENDER_NUMBER
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

// RCS template, with an SMS fallback carrying the same code.
const rcsProvider = new IWINVProvider({
  rcsApiKey: process.env.IWINV_RCS_API_KEY!,
  rcsBrandId: process.env.IWINV_RCS_BRAND_ID,
  senderNumber: process.env.IWINV_SENDER_NUMBER,
});
const rcs = await rcsProvider.send({
  type: "RCS_TPL",
  to: "01012345678",
  templateId: "YOUR_RCS_TEMPLATE_CODE",
  variables: { code: "123456" },
  failover: { enabled: true, fallbackContent: "[Service] code 123456" },
});
if (rcs.isFailure) throw rcs.error;

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

## Send Errors

When IWINV answers a send (AlimTalk, SMS/LMS/MMS or RCS) with a failure, the
`KMsgError` carries IWINV's own answer next to the normalized `code`:

- `providerErrorCode` (`string`): IWINV's integer `resultCode` (SMS v2) or
  `code` (AlimTalk, RCS) as a string, e.g. `"13"` or `"505"`. Unset when the body
  held no such code (plain text such as `Forbidden`, or an HTML error page).
- `providerErrorText` (`string`): IWINV's `message`. For a bare-code SMS
  response it is the text IWINV documents for that code. Unset otherwise.
  Control characters become spaces, phone-like runs of 9+ digits become `***`,
  and it is cut to 500 characters. The error's `message` is the same text.
- `httpStatus` (`number`): the HTTP status of IWINV's response. It takes part
  in retry classification (`ErrorUtils.classifyForRetry`) after the policy's
  code lists: a `retryableCodes`/`nonRetryableCodes` entry for the error's
  `code` wins first, then `retryableStatuses`/`nonRetryableStatuses` match the
  status, and when no code list (the policy's or the default) holds the `code`,
  the status decides.
- `details.originalCode`: the raw code as IWINV sent it. A plain-text SMS body
  is no longer put here.
- `details.reason` (`IWINVSendErrorReason`, one of `IWINV_SEND_ERROR_REASONS`):
  set when IWINV's code or text names the refusal. Read it with
  `getIWINVSendErrorReason(error)`.
  - `SENDER_NUMBER_NOT_REGISTERED`: SMS `13`, AlimTalk `505`, RCS `217`/`218`,
    or a text such as "조직(업체) 발신번호가 일치하지 않습니다."
  - `IP_NOT_ALLOWED`: SMS `15`/`206`, AlimTalk `206`, RCS `206`, or a text
    saying so.
  - `RECIPIENT_NUMBER_INVALID`: SMS `41`, RCS `214`/`215`/`221`.
  - `AUTO_CHARGE_LIMIT_EXCEEDED`: SMS `50`, RCS `222`.

  The HTTP status decides the normalized `code` first: HTTP `429` is
  `RATE_LIMIT_EXCEEDED` and HTTP 5xx is `NETWORK_ERROR` (SMS) or
  `PROVIDER_ERROR` (AlimTalk, RCS), both retryable, whatever code the body holds.
  Otherwise the codes above map to a non-retryable code. A sender-number or IP
  refusal read only from the text becomes `INVALID_REQUEST` or
  `AUTHENTICATION_FAILED` when the code would otherwise be the generic
  `PROVIDER_ERROR`/`NETWORK_ERROR` of an unlisted code; AlimTalk code `429` and
  an unlisted 5xx code keep their own, retryable code. The reason is set in
  every case. More reasons may be added; treat unknown values as no reason.

An AlimTalk send is accepted when IWINV answers 2xx with code `200`, as an
integer or the string `"200"`; its `seqNo` (number or digit string, up to
`Number.MAX_SAFE_INTEGER`) becomes `providerMessageId`. A string code is read as an integer, so `{"code":"505"}`
is a refusal like `505`, and a code that is not an integer (`"200.0"`, `"2e2"`)
counts as no code. RCS sends read `code` the same way.

RCS codes map as follows: `202`, `204`, `205` and `206` are
`AUTHENTICATION_FAILED`; `207` is `TEMPLATE_NOT_FOUND`; `203` and `208`–`221`
are `INVALID_REQUEST`; `222`, `224` and `225` are `INSUFFICIENT_BALANCE`; `223`
(an auto-charge in progress) and any unlisted code are `PROVIDER_ERROR`. A 200
answer whose `success` is `0` (no recipient taken) is also `PROVIDER_ERROR`.

A 2xx answer without a numeric code (`{}`, `{"code":"x"}`, an empty body, or
plain text such as `OK`) is `PROVIDER_ERROR` on every channel, with no
`providerErrorCode`: IWINV may have accepted the send, so it is not reported as
a refusal (`INVALID_REQUEST`) and not as a success. The exception is a
`message` that names a refusal (`details.reason` above, e.g. "조직(업체)
발신번호가 일치하지 않습니다."): IWINV said it refused the send, so it keeps
the code that refusal implies (`INVALID_REQUEST` or `AUTHENTICATION_FAILED`),
as it does under an unlisted code. `PROVIDER_ERROR` is
retryable by default, so a retry can send the message twice; a consumer that
cannot tolerate that should treat this as an unknown outcome and check delivery
status before retrying. A numeric refusal code on HTTP 200 (AlimTalk `501`, SMS
`13`, ...) keeps the mapping above.

`normalizeProviderError` keeps these fields in both `safe` and `compat` mode.

`providerErrorText` and the message are written by IWINV, not k-msg. They can
echo what was sent (AlimTalk `540` names the blocked word from the message), so
treat them as sensitive: mask or drop them before logging or storing them where
message content may not go.

## Troubleshooting

- `resultCode=14` (SMS): verify exact `SMS_API_KEY` + `SMS_AUTH_KEY` pair and `secret` header encoding format.
- `resultCode=15` or AlimTalk `code=206`: whitelist your real egress IP in IWINV.
- AlimTalk `code=505`: register/approve sender number first in IWINV console.
- Sender errors (`13`): ensure sender is approved in the relevant channel console.

## License

MIT
