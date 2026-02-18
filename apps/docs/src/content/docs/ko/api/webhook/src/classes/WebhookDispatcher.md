---
editUrl: false
next: false
prev: false
title: "WebhookDispatcher"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:54](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.dispatcher.ts#L54)

## Constructors

### Constructor

> **new WebhookDispatcher**(`config`, `httpClient?`): `WebhookDispatcher`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:60](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.dispatcher.ts#L60)

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

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:67](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.dispatcher.ts#L67)

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

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:280](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.dispatcher.ts#L280)

#### Returns

`Promise`\<`void`\>
