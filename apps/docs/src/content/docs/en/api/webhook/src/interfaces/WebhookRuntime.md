---
editUrl: false
next: false
prev: false
title: "WebhookRuntime"
---

Defined in: [packages/webhook/src/runtime/types.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L101)

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/types.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L102)

#### Parameters

##### input

[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

***

### addEndpoints()

> **addEndpoints**(`inputs`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L103)

#### Parameters

##### inputs

readonly [`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)[]

#### Returns

`Promise`\<`object`[]\>

***

### emit()

> **emit**(`event`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L116)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

#### Returns

`Promise`\<`void`\>

***

### emitSync()

> **emitSync**(`event`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:117](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L117)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

#### Returns

`Promise`\<`object`[]\>

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L118)

#### Returns

`Promise`\<`void`\>

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/runtime/types.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L111)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

***

### listDeliveries()

> **listDeliveries**(`options?`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L119)

#### Parameters

##### options?

[`WebhookDeliveryListOptions`](/en/api/webhook/src/interfaces/webhookdeliverylistoptions/)

#### Returns

`Promise`\<`object`[]\>

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:112](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L112)

#### Returns

`Promise`\<`object`[]\>

***

### migrateFieldCryptoToTenant()

> **migrateFieldCryptoToTenant**(): `Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

Defined in: [packages/webhook/src/runtime/types.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L128)

Re-encrypts stored endpoint secrets and delivery payloads written before
ciphertext was bound to `fieldCrypto.tenantId`. Run it once every
instance is upgraded; endpoint writes through this runtime wait until it
finishes. See `migrateWebhookFieldCryptoToTenant`.

#### Returns

`Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

***

### probeEndpoint()

> **probeEndpoint**(`input`): `Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: [packages/webhook/src/runtime/types.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L113)

#### Parameters

##### input

`string` \| [`WebhookRuntimeTestPayload`](/en/api/webhook/src/interfaces/webhookruntimetestpayload/)

#### Returns

`Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L110)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L129)

#### Returns

`Promise`\<`void`\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/types.ts:106](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L106)

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>
