---
editUrl: false
next: false
prev: false
title: "WebhookEndpointStore"
---

Defined in: [packages/webhook/src/runtime/types.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L30)

Stores webhook endpoints. Ids and URLs are unique: a store never replaces
one endpoint with another, so a re-registered URL cannot silently get a
new id and secret.

## Methods

### add()

> **add**(`endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L35)

Stores a new endpoint. Rejects with `WebhookEndpointConflictError` when
an endpoint with the same id or URL is already stored.

#### Parameters

##### endpoint

###### active

`boolean` = `...`

###### createdAt

`Date` = `...`

###### description?

`string` = `...`

###### events

[`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[] = `...`

###### filters?

\{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \} = `...`

###### filters.channelId?

`string`[] = `...`

###### filters.providerId?

`string`[] = `...`

###### filters.templateId?

`string`[] = `...`

###### headers?

`Record`\<`string`, `string`\> = `...`

###### id

`string` = `...`

###### lastTriggeredAt?

`Date` = `...`

###### name?

`string` = `...`

###### retryConfig?

\{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \} = `...`

###### retryConfig.backoffMultiplier

`number` = `...`

###### retryConfig.maxRetries

`number` = `...`

###### retryConfig.retryDelayMs

`number` = `...`

###### secret?

`string` = `...`

###### secretUndecryptable?

`true` = `...`

###### status

`"error"` \| `"active"` \| `"inactive"` \| `"suspended"` = `...`

###### updatedAt

`Date` = `...`

###### url

`string` = `...`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`endpointId`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/runtime/types.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L43)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

***

### list()

> **list**(): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L44)

#### Returns

`Promise`\<`object`[]\>

***

### remove()

> **remove**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L42)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### update()

> **update**(`endpointId`, `endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L41)

Replaces the endpoint stored under `endpointId`. Rejects when there is
none, and with `WebhookEndpointConflictError` when another endpoint has
the new URL.

#### Parameters

##### endpointId

`string`

##### endpoint

###### active

`boolean` = `...`

###### createdAt

`Date` = `...`

###### description?

`string` = `...`

###### events

[`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[] = `...`

###### filters?

\{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \} = `...`

###### filters.channelId?

`string`[] = `...`

###### filters.providerId?

`string`[] = `...`

###### filters.templateId?

`string`[] = `...`

###### headers?

`Record`\<`string`, `string`\> = `...`

###### id

`string` = `...`

###### lastTriggeredAt?

`Date` = `...`

###### name?

`string` = `...`

###### retryConfig?

\{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \} = `...`

###### retryConfig.backoffMultiplier

`number` = `...`

###### retryConfig.maxRetries

`number` = `...`

###### retryConfig.retryDelayMs

`number` = `...`

###### secret?

`string` = `...`

###### secretUndecryptable?

`true` = `...`

###### status

`"error"` \| `"active"` \| `"inactive"` \| `"suspended"` = `...`

###### updatedAt

`Date` = `...`

###### url

`string` = `...`

#### Returns

`Promise`\<`void`\>
