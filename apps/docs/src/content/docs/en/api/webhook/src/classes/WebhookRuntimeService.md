---
editUrl: false
next: false
prev: false
title: "WebhookRuntimeService"
---

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L55)

## Implements

- [`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/)

## Constructors

### Constructor

> **new WebhookRuntimeService**(`config`): `WebhookRuntimeService`

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L70)

#### Parameters

##### config

[`WebhookRuntimeConfig`](/api/webhook/src/interfaces/webhookruntimeconfig/)

#### Returns

`WebhookRuntimeService`

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L86)

#### Parameters

##### input

[`WebhookEndpointInput`](/api/webhook/src/type-aliases/webhookendpointinput/)

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`addEndpoint`](/api/webhook/src/interfaces/webhookruntime/#addendpoint)

***

### addEndpoints()

> **addEndpoints**(`inputs`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L108)

#### Parameters

##### inputs

readonly [`WebhookEndpointInput`](/api/webhook/src/type-aliases/webhookendpointinput/)[]

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`addEndpoints`](/api/webhook/src/interfaces/webhookruntime/#addendpoints)

***

### emit()

> **emit**(`event`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:211](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L211)

#### Parameters

##### event

[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`emit`](/api/webhook/src/interfaces/webhookruntime/#emit)

***

### emitSync()

> **emitSync**(`event`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:226](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L226)

#### Parameters

##### event

[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`emitSync`](/api/webhook/src/interfaces/webhookruntime/#emitsync)

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:248](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L248)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`flush`](/api/webhook/src/interfaces/webhookruntime/#flush)

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:160](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L160)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`getEndpoint`](/api/webhook/src/interfaces/webhookruntime/#getendpoint)

***

### listDeliveries()

> **listDeliveries**(`options?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:256](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L256)

#### Parameters

##### options?

[`WebhookDeliveryListOptions`](/api/webhook/src/interfaces/webhookdeliverylistoptions/) = `{}`

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`listDeliveries`](/api/webhook/src/interfaces/webhookruntime/#listdeliveries)

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:165](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L165)

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`listEndpoints`](/api/webhook/src/interfaces/webhookruntime/#listendpoints)

***

### probeEndpoint()

> **probeEndpoint**(`input`): `Promise`\<[`WebhookTestResult`](/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L170)

#### Parameters

##### input

`string` | [`WebhookRuntimeTestPayload`](/api/webhook/src/interfaces/webhookruntimetestpayload/)

#### Returns

`Promise`\<[`WebhookTestResult`](/api/webhook/src/interfaces/webhooktestresult/)\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`probeEndpoint`](/api/webhook/src/interfaces/webhookruntime/#probeendpoint)

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:155](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L155)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`removeEndpoint`](/api/webhook/src/interfaces/webhookruntime/#removeendpoint)

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:266](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L266)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`shutdown`](/api/webhook/src/interfaces/webhookruntime/#shutdown)

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L119)

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`updateEndpoint`](/api/webhook/src/interfaces/webhookruntime/#updateendpoint)
