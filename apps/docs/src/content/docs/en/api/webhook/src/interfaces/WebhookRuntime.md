---
editUrl: false
next: false
prev: false
title: "WebhookRuntime"
---

Defined in: [packages/webhook/src/runtime/types.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L111)

## Methods

### addEndpoint()

> **addEndpoint**(`input`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/types.ts:112](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L112)

#### Parameters

##### input

[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

***

### addEndpoints()

> **addEndpoints**(`inputs`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L113)

#### Parameters

##### inputs

readonly [`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)[]

#### Returns

`Promise`\<`object`[]\>

***

### emit()

> **emit**(`event`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L126)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

#### Returns

`Promise`\<`void`\>

***

### emitSync()

> **emitSync**(`event`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:127](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L127)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

#### Returns

`Promise`\<`object`[]\>

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L128)

#### Returns

`Promise`\<`void`\>

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/runtime/types.ts:121](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L121)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

***

### listDeliveries()

> **listDeliveries**(`options?`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L129)

#### Parameters

##### options?

[`WebhookDeliveryListOptions`](/en/api/webhook/src/interfaces/webhookdeliverylistoptions/)

#### Returns

`Promise`\<`object`[]\>

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:122](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L122)

#### Returns

`Promise`\<`object`[]\>

***

### migrateFieldCryptoToTenant()

> **migrateFieldCryptoToTenant**(): `Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

Defined in: [packages/webhook/src/runtime/types.ts:138](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L138)

Re-encrypts stored endpoint secrets and delivery payloads written before
ciphertext was bound to `fieldCrypto.tenantId`. Run it once every
instance is upgraded; endpoint writes through this runtime wait until it
finishes. See `migrateWebhookFieldCryptoToTenant`.

#### Returns

`Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

***

### probeEndpoint()

> **probeEndpoint**(`input`): `Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: [packages/webhook/src/runtime/types.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L123)

#### Parameters

##### input

`string` \| [`WebhookRuntimeTestPayload`](/en/api/webhook/src/interfaces/webhookruntimetestpayload/)

#### Returns

`Promise`\<[`WebhookTestResult`](/en/api/webhook/src/interfaces/webhooktestresult/)\>

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L120)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:144](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L144)

Stops the batch timer, delivers the queued events, waits for endpoint
writes already queued, and closes the persistence. Endpoint changes
requested after it starts are rejected.

#### Returns

`Promise`\<`void`\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/runtime/types.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L116)

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpointInput`](/en/api/webhook/src/type-aliases/webhookendpointinput/)\>

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \}\>
