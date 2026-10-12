---
editUrl: false
next: false
prev: false
title: "MockHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:150](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L150)

## Implements

- [`HttpClient`](/en/api/webhook/src/interfaces/httpclient/)

## Constructors

### Constructor

> **new MockHttpClient**(): `MockHttpClient`

#### Returns

`MockHttpClient`

## Methods

### fetch()

> **fetch**(`url`, `_options`): `Promise`\<`Response`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:169](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L169)

#### Parameters

##### url

`string`

##### \_options

`RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`HttpClient`](/en/api/webhook/src/interfaces/httpclient/).[`fetch`](/en/api/webhook/src/interfaces/httpclient/#fetch)

***

### setDefaultResponse()

> **setDefaultResponse**(`response`): `void`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:165](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L165)

#### Parameters

##### response

`Response`

#### Returns

`void`

***

### setMockResponse()

> **setMockResponse**(`url`, `response`): `void`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:161](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L161)

#### Parameters

##### url

`string`

##### response

`Response`

#### Returns

`void`
