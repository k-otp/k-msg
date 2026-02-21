---
editUrl: false
next: false
prev: false
title: "MockHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L21)

## Implements

- [`HttpClient`](/api/webhook/src/interfaces/httpclient/)

## Constructors

### Constructor

> **new MockHttpClient**(): `MockHttpClient`

#### Returns

`MockHttpClient`

## Methods

### fetch()

> **fetch**(`url`, `_options`): `Promise`\<`Response`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L40)

#### Parameters

##### url

`string`

##### \_options

`RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`HttpClient`](/api/webhook/src/interfaces/httpclient/).[`fetch`](/api/webhook/src/interfaces/httpclient/#fetch)

***

### setDefaultResponse()

> **setDefaultResponse**(`response`): `void`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L36)

#### Parameters

##### response

`Response`

#### Returns

`void`

***

### setMockResponse()

> **setMockResponse**(`url`, `response`): `void`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L32)

#### Parameters

##### url

`string`

##### response

`Response`

#### Returns

`void`
