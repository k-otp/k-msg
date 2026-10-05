---
npm/@k-msg/core: minor
npm/@k-msg/messaging: minor
npm/@k-msg/provider: minor
---

`IWINVProvider` sends IWINV RCS template messages (`RCS_TPL`), with an SMS/LMS fallback and delivery-status lookup.

- New `IWINVConfig` fields: `rcsApiKey` (IWINV's RCS send API key, sent as `AUTH: base64(key)`; it enables `RCS_TPL`), `rcsBrandId` (default brand) and `rcsSenderNumber` (falls back to `senderNumber`). `createDefaultIWINVProvider()` reads `IWINV_RCS_API_KEY`, `IWINV_RCS_BRAND_ID` and `IWINV_RCS_SENDER_NUMBER`. An RCS-only config needs no AlimTalk or SMS keys. The CLI config accepts the same fields, and `k-msg providers doctor` lists the manual RCS checks `rcs_brand_template_approved` and `rcs_send_ip_registered`.
- `RCS_TPL` posts to `https://rcs.bizservice.iwinv.kr/api/v1/send/`. `templateId` (or `rcs.templateId`) is the template code, `rcs.brandId` (or `rcsBrandId`) the brand, and `variables` (with `rcs.variables`) are sent by name as `templateParam`. `options.scheduledAt` reserves the send. IWINV offers RCS templates only, so the other `RCS_*` types stay unsupported on IWINV.
- `@k-msg/core`: `RcsTemplateSendOptions` gains `failover` (`RcsFailoverOptions`, the same shape as `AlimTalkFailoverOptions`). IWINV maps it to `reSend`/`resendType`/`resendTitle`/`resendContent`. The fallback type follows `fallbackChannel` or the text's size. Text over 90 bytes as SMS or 2,000 bytes as LMS fails with `INVALID_REQUEST` before sending, and `rcs.disableSms: true` or `failover.enabled: false` sends no fallback. SOLAPI does not map it and returns a `FAILOVER_UNSUPPORTED_PROVIDER` warning.
- `@k-msg/messaging`: `KMsg` fills `#{name}` placeholders in RCS template fallback text and sizes it for SMS or LMS, as it already did for AlimTalk.
- IWINV's RCS send answer carries no message key, so `providerMessageId` is a correlation id, `iwinv-rcs:<brandId>:<templateCode>`. `getDeliveryStatus` looks the send up in IWINV's RCS history (`/api/v1/history/`) by brand, template, recipient and request time. Two sends of one template to one number within moments of each other cannot be told apart. An IWINV `msgkey` passed as `providerMessageId` is looked up as is.
- History rows map to statuses as follows: `state` 수신완료 → `DELIVERED`, 수신실패 → `FAILED`, 대기 → `PENDING`. Otherwise `done_code` `10000` → `DELIVERED`, and any other code → `FAILED`.
- RCS send codes are normalized like the other channels: HTTP 429/5xx first, then `202`/`204`/`205`/`206` → `AUTHENTICATION_FAILED`, `207` → `TEMPLATE_NOT_FOUND`, `203`/`208`–`221` → `INVALID_REQUEST`, `222`/`224`/`225` → `INSUFFICIENT_BALANCE`, and `223` or unlisted codes → `PROVIDER_ERROR`. A code-less 2xx answer, or a 200 with `success: 0`, is also `PROVIDER_ERROR`.
- `details.reason` now also covers RCS: `IP_NOT_ALLOWED` (`206`), `SENDER_NUMBER_NOT_REGISTERED` (`217`/`218`), `RECIPIENT_NUMBER_INVALID` (`214`/`215`/`221`) and `AUTO_CHARGE_LIMIT_EXCEEDED` (`222`).
