---
editUrl: false
next: false
prev: false
title: "WebhookRuntimeService"
---

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L60)

## Implements

- [`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/)

## Constructors

### Constructor

> **new WebhookRuntimeService**(`config`): `WebhookRuntimeService`

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L75)

#### Parameters

##### config

[`WebhookRuntimeConfig`](/en/api/webhook/src/interfaces/webhookruntimeconfig/)

#### Returns

`WebhookRuntimeService`

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L98)

#### Parameters

##### input

[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`addEndpoint`](/en/api/webhook/src/interfaces/webhookruntime/#addendpoint)

***

### addEndpoints()

> **addEndpoints**(`inputs`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L120)

#### Parameters

##### inputs

readonly [`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)[]

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`addEndpoints`](/en/api/webhook/src/interfaces/webhookruntime/#addendpoints)

***

### emit()

> **emit**(`event`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:223](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L223)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`emit`](/en/api/webhook/src/interfaces/webhookruntime/#emit)

***

### emitSync()

> **emitSync**(`event`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:238](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L238)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`emitSync`](/en/api/webhook/src/interfaces/webhookruntime/#emitsync)

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:260](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L260)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`flush`](/en/api/webhook/src/interfaces/webhookruntime/#flush)

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L172)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`getEndpoint`](/en/api/webhook/src/interfaces/webhookruntime/#getendpoint)

***

### listDeliveries()

> **listDeliveries**(`options?`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:268](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L268)

#### Parameters

##### options?

[`WebhookDeliveryListOptions`](/en/api/webhook/src/interfaces/webhookdeliverylistoptions/) = `{}`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`listDeliveries`](/en/api/webhook/src/interfaces/webhookruntime/#listdeliveries)

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:177](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L177)

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`listEndpoints`](/en/api/webhook/src/interfaces/webhookruntime/#listendpoints)

***

### probeEndpoint()

> **probeEndpoint**(`input`): `Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:182](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L182)

#### Parameters

##### input

`string` \| [`WebhookRuntimeTestPayload`](/en/api/webhook/src/interfaces/webhookruntimetestpayload/)

#### Returns

`Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`probeEndpoint`](/en/api/webhook/src/interfaces/webhookruntime/#probeendpoint)

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L167)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`removeEndpoint`](/en/api/webhook/src/interfaces/webhookruntime/#removeendpoint)

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:278](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L278)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`shutdown`](/en/api/webhook/src/interfaces/webhookruntime/#shutdown)

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L131)

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`updateEndpoint`](/en/api/webhook/src/interfaces/webhookruntime/#updateendpoint)
