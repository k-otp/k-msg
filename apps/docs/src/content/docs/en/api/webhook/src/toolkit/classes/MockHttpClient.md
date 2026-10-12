---
editUrl: false
next: false
prev: false
title: "MockHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L115)

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

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:134](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L134)

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

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L130)

#### Parameters

##### response

`Response`

#### Returns

`void`

***

### setMockResponse()

> **setMockResponse**(`url`, `response`): `void`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L126)

#### Parameters

##### url

`string`

##### response

`Response`

#### Returns

`void`
