---
editUrl: false
next: false
prev: false
title: "WebhookRuntime"
---

Defined in: packages/webhook/src/runtime/types.ts:65

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: packages/webhook/src/runtime/types.ts:66

#### Parameters

##### input

[`WebhookEndpointInput`](/api/webhook/src/type-aliases/webhookendpointinput/)

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

***

### addEndpoints()

> **addEndpoints**(`inputs`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: packages/webhook/src/runtime/types.ts:67

#### Parameters

##### inputs

readonly [`WebhookEndpointInput`](/api/webhook/src/type-aliases/webhookendpointinput/)[]

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### emit()

> **emit**(`event`): `Promise`\<`void`\>

Defined in: packages/webhook/src/runtime/types.ts:80

#### Parameters

##### event

[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<`void`\>

***

### emitSync()

> **emitSync**(`event`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: packages/webhook/src/runtime/types.ts:81

#### Parameters

##### event

[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: packages/webhook/src/runtime/types.ts:82

#### Returns

`Promise`\<`void`\>

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: packages/webhook/src/runtime/types.ts:75

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### listDeliveries()

> **listDeliveries**(`options?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: packages/webhook/src/runtime/types.ts:83

#### Parameters

##### options?

[`WebhookDeliveryListOptions`](/api/webhook/src/interfaces/webhookdeliverylistoptions/)

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: packages/webhook/src/runtime/types.ts:76

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### probeEndpoint()

> **probeEndpoint**(`input`): `Promise`\<[`WebhookTestResult`](/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: packages/webhook/src/runtime/types.ts:77

#### Parameters

##### input

`string` | [`WebhookRuntimeTestPayload`](/api/webhook/src/interfaces/webhookruntimetestpayload/)

#### Returns

`Promise`\<[`WebhookTestResult`](/api/webhook/src/interfaces/webhooktestresult/)\>

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: packages/webhook/src/runtime/types.ts:74

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: packages/webhook/src/runtime/types.ts:86

#### Returns

`Promise`\<`void`\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: packages/webhook/src/runtime/types.ts:70

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>
