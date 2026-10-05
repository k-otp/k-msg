---
editUrl: false
next: false
prev: false
title: "getIWINVSendErrorReason"
---

> **getIWINVSendErrorReason**(`error`): `"SENDER_NUMBER_NOT_REGISTERED"` \| `"IP_NOT_ALLOWED"` \| `"RECIPIENT_NUMBER_INVALID"` \| `"AUTO_CHARGE_LIMIT_EXCEEDED"` \| `undefined`

Defined in: [packages/provider/src/iwinv/iwinv.send-error.ts:230](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/iwinv.send-error.ts#L230)

Returns `details.reason` of an IWINV send error, or `undefined` when the
error has none (or a value this version does not know).

## Parameters

### error

`unknown`

## Returns

`"SENDER_NUMBER_NOT_REGISTERED"` \| `"IP_NOT_ALLOWED"` \| `"RECIPIENT_NUMBER_INVALID"` \| `"AUTO_CHARGE_LIMIT_EXCEEDED"` \| `undefined`
