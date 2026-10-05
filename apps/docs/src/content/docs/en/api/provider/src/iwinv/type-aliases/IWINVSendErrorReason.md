---
editUrl: false
next: false
prev: false
title: "IWINVSendErrorReason"
---

> **IWINVSendErrorReason** = *typeof* [`IWINV_SEND_ERROR_REASONS`](/en/api/provider/src/iwinv/variables/iwinv_send_error_reasons/)\[`number`\]

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:300](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L300)

Why IWINV refused a send, set as `details.reason` on the send's `KMsgError`
when IWINV's code or text says more than the normalized `code` does. Read it
with `getIWINVSendErrorReason`.

- `SENDER_NUMBER_NOT_REGISTERED`: the sender number is not registered (or
  not approved) for the IWINV account. SMS `13`, AlimTalk `505`, a message
  saying so (e.g. "조직(업체) 발신번호가 일치하지 않습니다."), or
  RCS `218` (`217` when the account has no sender number at all).
- `IP_NOT_ALLOWED`: the request came from an IP the account does not allow.
  SMS `15`/`206`, AlimTalk `206`, RCS `206`, or a message saying so.
- `RECIPIENT_NUMBER_INVALID`: the recipient number is missing or malformed.
  SMS `41`, RCS `214`/`215`/`221`.
- `AUTO_CHARGE_LIMIT_EXCEEDED`: the daily auto-charge limit is used up.
  SMS `50`, RCS `222`.

A reason read from IWINV's text sets the normalized code only when that code
was otherwise the generic `PROVIDER_ERROR`/`NETWORK_ERROR` of an unlisted
code; a rate limit, an HTTP 5xx or a 5xx code keeps its own code. More
reasons may be added; treat unknown values as no reason.
