---
editUrl: false
next: false
prev: false
title: "DefaultHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.dispatcher.ts#L15)

## Implements

- [`HttpClient`](/api/webhook/src/interfaces/httpclient/)

## Constructors

### Constructor

> **new DefaultHttpClient**(): `DefaultHttpClient`

#### Returns

`DefaultHttpClient`

## Methods

### fetch()

> **fetch**(`url`, `options`): `Promise`\<`Response`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:16](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.dispatcher.ts#L16)

#### Parameters

##### url

`string`

##### options

`RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`HttpClient`](/api/webhook/src/interfaces/httpclient/).[`fetch`](/api/webhook/src/interfaces/httpclient/#fetch)
