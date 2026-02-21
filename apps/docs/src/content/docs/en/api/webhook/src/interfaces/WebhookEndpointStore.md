---
editUrl: false
next: false
prev: false
title: "WebhookEndpointStore"
---

Defined in: packages/webhook/src/runtime/types.ts:17

## Methods

### add()

> **add**(`endpoint`): `Promise`\<`void`\>

Defined in: packages/webhook/src/runtime/types.ts:18

#### Parameters

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`endpointId`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: packages/webhook/src/runtime/types.ts:21

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### list()

> **list**(): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: packages/webhook/src/runtime/types.ts:22

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### remove()

> **remove**(`endpointId`): `Promise`\<`void`\>

Defined in: packages/webhook/src/runtime/types.ts:20

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### update()

> **update**(`endpointId`, `endpoint`): `Promise`\<`void`\>

Defined in: packages/webhook/src/runtime/types.ts:19

#### Parameters

##### endpointId

`string`

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<`void`\>
