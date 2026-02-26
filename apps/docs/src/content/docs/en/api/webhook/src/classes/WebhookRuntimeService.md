---
editUrl: false
next: false
prev: false
title: "WebhookRuntimeService"
---

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L60)

## Implements

- [`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/)

## Constructors

### Constructor

> **new WebhookRuntimeService**(`config`): `WebhookRuntimeService`

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L75)

#### Parameters

##### config

[`WebhookRuntimeConfig`](/api/webhook/src/interfaces/webhookruntimeconfig/)

#### Returns

`WebhookRuntimeService`

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L98)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L120)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:223](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L223)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:238](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L238)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:260](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L260)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`flush`](/api/webhook/src/interfaces/webhookruntime/#flush)

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L172)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:268](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L268)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:177](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L177)

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`listEndpoints`](/api/webhook/src/interfaces/webhookruntime/#listendpoints)

***

### probeEndpoint()

> **probeEndpoint**(`input`): `Promise`\<[`WebhookTestResult`](/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:182](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L182)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L167)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:278](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L278)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`shutdown`](/api/webhook/src/interfaces/webhookruntime/#shutdown)

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L131)

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

#### Implementation of

[`WebhookRuntime`](/api/webhook/src/interfaces/webhookruntime/).[`updateEndpoint`](/api/webhook/src/interfaces/webhookruntime/#updateendpoint)
