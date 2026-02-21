---
editUrl: false
next: false
prev: false
title: "DefaultHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L15)

## Implements

- [`HttpClient`](/api/webhook/src/interfaces/httpclient/)

## Constructors

### Constructor

> **new DefaultHttpClient**(): `DefaultHttpClient`

#### Returns

`DefaultHttpClient`

## Methods

### fetch()

> **fetch**(`url`, `_options`): `Promise`\<`Response`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L16)

#### Parameters

##### url

`string`

##### \_options

`RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`HttpClient`](/api/webhook/src/interfaces/httpclient/).[`fetch`](/api/webhook/src/interfaces/httpclient/#fetch)
