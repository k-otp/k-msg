---
editUrl: false
next: false
prev: false
title: "DefaultHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L36)

## Implements

- [`HttpClient`](/en/api/webhook/src/interfaces/httpclient/)

## Constructors

### Constructor

> **new DefaultHttpClient**(): `DefaultHttpClient`

#### Returns

`DefaultHttpClient`

## Methods

### fetch()

> **fetch**(`url`, `_options`): `Promise`\<`Response`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L37)

#### Parameters

##### url

`string`

##### \_options

`RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`HttpClient`](/en/api/webhook/src/interfaces/httpclient/).[`fetch`](/en/api/webhook/src/interfaces/httpclient/#fetch)
