---
editUrl: false
next: false
prev: false
title: "WebhookDispatcher"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L52)

## Constructors

### Constructor

> **new WebhookDispatcher**(`config`, `httpClient?`): `WebhookDispatcher`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L58)

#### Parameters

##### config

[`WebhookConfig`](/api/webhook/src/interfaces/webhookconfig/)

##### httpClient?

[`HttpClient`](/api/webhook/src/interfaces/httpclient/)

#### Returns

`WebhookDispatcher`

## Methods

### dispatch()

> **dispatch**(`event`, `endpoint`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L65)

#### Parameters

##### event

[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:278](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L278)

#### Returns

`Promise`\<`void`\>
