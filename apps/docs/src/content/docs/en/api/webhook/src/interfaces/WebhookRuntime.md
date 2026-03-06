---
editUrl: false
next: false
prev: false
title: "WebhookRuntime"
---

Defined in: [packages/webhook/src/runtime/types.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L73)

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/runtime/types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L74)

#### Parameters

##### input

[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)

#### Returns

`Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/)\>

***

### addEndpoints()

> **addEndpoints**(`inputs`): `Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: [packages/webhook/src/runtime/types.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L75)

#### Parameters

##### inputs

readonly [`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)[]

#### Returns

`Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### emit()

> **emit**(`event`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L88)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<`void`\>

***

### emitSync()

> **emitSync**(`event`): `Promise`\<[`WebhookDelivery`](/en/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/runtime/types.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L89)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<[`WebhookDelivery`](/en/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L90)

#### Returns

`Promise`\<`void`\>

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: [packages/webhook/src/runtime/types.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L83)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### listDeliveries()

> **listDeliveries**(`options?`): `Promise`\<[`WebhookDelivery`](/en/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/runtime/types.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L91)

#### Parameters

##### options?

[`WebhookDeliveryListOptions`](/en/api/webhook/src/interfaces/webhookdeliverylistoptions/)

#### Returns

`Promise`\<[`WebhookDelivery`](/en/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: [packages/webhook/src/runtime/types.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L84)

#### Returns

`Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### probeEndpoint()

> **probeEndpoint**(`input`): `Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: [packages/webhook/src/runtime/types.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L85)

#### Parameters

##### input

`string` | [`WebhookRuntimeTestPayload`](/en/api/webhook/src/interfaces/webhookruntimetestpayload/)

#### Returns

`Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L82)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L94)

#### Returns

`Promise`\<`void`\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/runtime/types.ts:78](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L78)

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<[`WebhookEndpoint`](/en/api/webhook/src/interfaces/webhookendpoint/)\>
