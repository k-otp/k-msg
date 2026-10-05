---
editUrl: false
next: false
prev: false
title: "IWINVConfig"
---

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:205](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L205)

## Properties

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:211](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L211)

IWINV AlimTalk API key (used for AUTH header). Required for AlimTalk sends,
AlimTalk history and balance, and the template APIs; SMS-only use can omit
it and set `smsApiKey` and `smsAuthKey` instead.

***

### debug?

> `optional` **debug?**: `boolean`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:252](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L252)

***

### extraHeaders?

> `optional` **extraHeaders?**: `Record`\<`string`, `string`\>

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:245](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L245)

Extra HTTP headers merged into outgoing requests.
Use with care: overriding AUTH/secret can break requests.

***

### ipAlertWebhookUrl?

> `optional` **ipAlertWebhookUrl?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:248](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L248)

***

### ipRetryCount?

> `optional` **ipRetryCount?**: `number`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:246](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L246)

***

### ipRetryDelayMs?

> `optional` **ipRetryDelayMs?**: `number`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:247](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L247)

***

### onIpRestrictionAlert?

> `optional` **onIpRestrictionAlert?**: (`payload`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:249](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L249)

#### Parameters

##### payload

[`IWINVIPRestrictionAlert`](/en/api/provider/src/iwinv/interfaces/iwinviprestrictionalert/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### rcsApiKey?

> `optional` **rcsApiKey?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:227](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L227)

IWINV RCS send API key ("RCS 발송 API Key" of the RCS account in the IWINV
console), sent as `AUTH: base64(rcsApiKey)`. It is separate from the
AlimTalk and SMS keys, and enables `RCS_TPL`.

***

### rcsBrandId?

> `optional` **rcsBrandId?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:229](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L229)

Default RCS brand id (`BR....`); `options.rcs.brandId` overrides it.

***

### rcsSenderNumber?

> `optional` **rcsSenderNumber?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:234](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L234)

Sender number (`callback`) for RCS; falls back to `senderNumber`.
`options.from` overrides it.

***

### sendEndpoint?

> `optional` **sendEndpoint?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:235](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L235)

***

### senderNumber?

> `optional` **senderNumber?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:220](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L220)

***

### smsApiKey?

> `optional` **smsApiKey?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:213](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L213)

***

### smsAuthKey?

> `optional` **smsAuthKey?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:214](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L214)

***

### smsCompanyId?

> `optional` **smsCompanyId?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:219](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L219)

SMS v2 전송 내역 조회시 필요한 조직(업체) 발송 아이디.
(API 문서의 `companyid`)

***

### smsSenderNumber?

> `optional` **smsSenderNumber?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:221](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L221)

***

### xForwardedFor?

> `optional` **xForwardedFor?**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:240](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/types/iwinv.ts#L240)

Optional proxy/IP override header for IP-restricted IWINV endpoints.
Intended for testing or controlled environments; production should whitelist real egress IPs.
