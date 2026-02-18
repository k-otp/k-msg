---
editUrl: false
next: false
prev: false
title: "IWINVConfig"
---

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:205](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L205)

## Properties

### apiKey

> **apiKey**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:209](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L209)

IWINV AlimTalk API key (used for AUTH header).

***

### debug?

> `optional` **debug**: `boolean`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:237](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L237)

***

### extraHeaders?

> `optional` **extraHeaders**: `Record`\<`string`, `string`\>

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:230](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L230)

Extra HTTP headers merged into outgoing requests.
Use with care: overriding AUTH/secret can break requests.

***

### ipAlertWebhookUrl?

> `optional` **ipAlertWebhookUrl**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:233](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L233)

***

### ipRetryCount?

> `optional` **ipRetryCount**: `number`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:231](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L231)

***

### ipRetryDelayMs?

> `optional` **ipRetryDelayMs**: `number`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:232](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L232)

***

### onIpRestrictionAlert()?

> `optional` **onIpRestrictionAlert**: (`payload`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:234](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L234)

#### Parameters

##### payload

[`IWINVIPRestrictionAlert`](/api/provider/src/iwinv/interfaces/iwinviprestrictionalert/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### sendEndpoint?

> `optional` **sendEndpoint**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:220](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L220)

***

### senderNumber?

> `optional` **senderNumber**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:218](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L218)

***

### smsApiKey?

> `optional` **smsApiKey**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:211](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L211)

***

### smsAuthKey?

> `optional` **smsAuthKey**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:212](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L212)

***

### smsCompanyId?

> `optional` **smsCompanyId**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:217](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L217)

SMS v2 전송 내역 조회시 필요한 조직(업체) 발송 아이디.
(API 문서의 `companyid`)

***

### smsSenderNumber?

> `optional` **smsSenderNumber**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:219](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L219)

***

### xForwardedFor?

> `optional` **xForwardedFor**: `string`

Defined in: [packages/provider/src/iwinv/types/iwinv.ts:225](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/iwinv/types/iwinv.ts#L225)

Optional proxy/IP override header for IP-restricted IWINV endpoints.
Intended for testing or controlled environments; production should whitelist real egress IPs.
