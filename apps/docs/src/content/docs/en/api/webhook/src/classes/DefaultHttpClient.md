---
editUrl: false
next: false
prev: false
title: "DefaultHttpClient"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L75)

## Implements

- [`HttpClient`](/en/api/webhook/src/interfaces/httpclient/)

## Constructors

### Constructor

> **new DefaultHttpClient**(`allowedHosts?`): `DefaultHttpClient`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L77)

#### Parameters

##### allowedHosts?

readonly `string`[] = `[]`

#### Returns

`DefaultHttpClient`

## Methods

### fetch()

> **fetch**(`url`, `_options`): `Promise`\<`Response`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L101)

#### Parameters

##### url

`string`

##### \_options

`RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

[`HttpClient`](/en/api/webhook/src/interfaces/httpclient/).[`fetch`](/en/api/webhook/src/interfaces/httpclient/#fetch)
