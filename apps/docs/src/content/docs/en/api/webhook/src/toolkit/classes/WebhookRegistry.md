---
editUrl: false
next: false
prev: false
title: "WebhookRegistry"
---

Defined in: [packages/webhook/src/services/webhook.registry.ts:142](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L142)

## Constructors

### Constructor

> **new WebhookRegistry**(`options?`): `WebhookRegistry`

Defined in: [packages/webhook/src/services/webhook.registry.ts:147](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L147)

#### Parameters

##### options?

[`WebhookRegistryOptions`](/en/api/webhook/src/interfaces/webhookregistryoptions/) = `{}`

#### Returns

`WebhookRegistry`

## Methods

### addDelivery()

> **addDelivery**(`delivery`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:184](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L184)

#### Parameters

##### delivery

###### attempts

`object`[] = `...`

###### completedAt?

`Date` = `...`

###### createdAt

`Date` = `...`

###### endpointId

`string` = `...`

###### eventId

`string` = `...`

###### eventType?

[`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded) = `...`

###### headers

`Record`\<`string`, `string`\> = `...`

###### httpMethod

`"POST"` \| `"PUT"` \| `"PATCH"` = `...`

###### id

`string` = `...`

###### nextRetryAt?

`Date` = `...`

###### payload

`string` = `...`

###### status

`"failed"` \| `"success"` \| `"pending"` \| `"exhausted"` = `...`

###### url

`string` = `...`

#### Returns

`Promise`\<`void`\>

***

### addEndpoint()

> **addEndpoint**(`endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:152](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L152)

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

###### status

`"error"` \| `"active"` \| `"inactive"` \| `"suspended"` = `...`

###### updatedAt

`Date` = `...`

###### url

`string` = `...`

#### Returns

`Promise`\<`void`\>

***

### getDeliveries()

> **getDeliveries**(`endpointId?`, `timeRange?`, `eventType?`, `status?`, `limit?`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:188](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L188)

#### Parameters

##### endpointId?

`string`

##### timeRange?

###### end

`Date`

###### start

`Date`

##### eventType?

[`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)

##### status?

`string`

##### limit?

`number` = `100`

#### Returns

`Promise`\<`object`[]\>

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L170)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

***

### getFailedDeliveries()

> **getFailedDeliveries**(`endpointId?`, `eventType?`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:224](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L224)

#### Parameters

##### endpointId?

`string`

##### eventType?

[`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)

#### Returns

`Promise`\<`object`[]\>

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:176](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L176)

#### Returns

`Promise`\<`object`[]\>

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:166](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L166)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:156](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L156)

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

###### status

`"error"` \| `"active"` \| `"inactive"` \| `"suspended"` = `...`

###### updatedAt

`Date` = `...`

###### url

`string` = `...`

#### Returns

`Promise`\<`void`\>
