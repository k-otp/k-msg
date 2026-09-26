---
editUrl: false
next: false
prev: false
title: "WebhookRuntimeService"
---

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L62)

## Implements

- [`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/)

## Constructors

### Constructor

> **new WebhookRuntimeService**(`config`): `WebhookRuntimeService`

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L83)

#### Parameters

##### config

[`WebhookRuntimeConfig`](/en/api/webhook/src/interfaces/webhookruntimeconfig/)

#### Returns

`WebhookRuntimeService`

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L107)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L129)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:240](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L240)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:258](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L258)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:280](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L280)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`flush`](/en/api/webhook/src/interfaces/webhookruntime/#flush)

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:189](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L189)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:290](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L290)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:194](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L194)

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`listEndpoints`](/en/api/webhook/src/interfaces/webhookruntime/#listendpoints)

***

### migrateFieldCryptoToTenant()

> **migrateFieldCryptoToTenant**(): `Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:308](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L308)

Re-encrypts stored endpoint secrets and delivery payloads written before
ciphertext was bound to `fieldCrypto.tenantId`, returning how many of
each it rewrote. Run it once every instance is upgraded, then remove
`fieldCrypto.acceptLegacyAad` if it was set to keep them readable in
the meantime. Endpoint writes through this runtime wait until it
finishes. See `migrateWebhookFieldCryptoToTenant`.

#### Returns

`Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`migrateFieldCryptoToTenant`](/en/api/webhook/src/interfaces/webhookruntime/#migratefieldcryptototenant)

***

### probeEndpoint()

> **probeEndpoint**(`input`): `Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:199](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L199)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:184](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L184)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:318](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L318)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`shutdown`](/en/api/webhook/src/interfaces/webhookruntime/#shutdown)

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:140](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L140)

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`updateEndpoint`](/en/api/webhook/src/interfaces/webhookruntime/#updateendpoint)
