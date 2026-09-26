---
editUrl: false
next: false
prev: false
title: "MockHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L42)

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

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L61)

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

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L57)

#### Parameters

##### response

`Response`

#### Returns

`void`

***

### setMockResponse()

> **setMockResponse**(`url`, `response`): `void`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L53)

#### Parameters

##### url

`string`

##### response

`Response`

#### Returns

`void`
