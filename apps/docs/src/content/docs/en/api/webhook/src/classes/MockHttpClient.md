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

> **fetch**(`url`, `options`): `Promise`\<`Response`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L28)

#### Parameters

##### url

`string`

##### options

`RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`HttpClient`](/api/webhook/src/interfaces/httpclient/).[`fetch`](/api/webhook/src/interfaces/httpclient/#fetch)

***

### setMockResponse()

> **setMockResponse**(`url`, `response`): `void`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L24)

#### Parameters

##### url

`string`

##### response

`Response`

#### Returns

`void`
