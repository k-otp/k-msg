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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L84)

#### Parameters

##### config

[`WebhookRuntimeConfig`](/en/api/webhook/src/interfaces/webhookruntimeconfig/)

#### Returns

`WebhookRuntimeService`

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L110)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:121](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L121)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:271](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L271)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:289](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L289)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:311](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L311)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`flush`](/en/api/webhook/src/interfaces/webhookruntime/#flush)

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:220](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L220)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:321](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L321)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:225](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L225)

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`listEndpoints`](/en/api/webhook/src/interfaces/webhookruntime/#listendpoints)

***

### migrateFieldCryptoToTenant()

> **migrateFieldCryptoToTenant**(): `Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:339](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L339)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:230](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L230)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:213](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L213)

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

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:349](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L349)

Stops the batch timer, delivers the queued events, waits for endpoint
writes already queued, and closes the persistence. Endpoint changes
requested after it starts are rejected.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`shutdown`](/en/api/webhook/src/interfaces/webhookruntime/#shutdown)

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/webhook-runtime.service.ts:169](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/webhook-runtime.service.ts#L169)

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

#### Implementation of

[`WebhookRuntime`](/en/api/webhook/src/interfaces/webhookruntime/).[`updateEndpoint`](/en/api/webhook/src/interfaces/webhookruntime/#updateendpoint)
