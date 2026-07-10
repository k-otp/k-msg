---
editUrl: false
next: false
prev: false
title: "WebhookDispatcher"
---

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L52)

## Constructors

### Constructor

> **new WebhookDispatcher**(`config`, `httpClient?`): `WebhookDispatcher`

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L58)

#### Parameters

##### config

[`WebhookConfig`](/en/api/webhook/src/interfaces/webhookconfig/)

##### httpClient?

[`HttpClient`](/en/api/webhook/src/interfaces/httpclient/)

#### Returns

`WebhookDispatcher`

## Methods

### dispatch()

> **dispatch**(`event`, `endpoint`): `Promise`\<\{ `attempts`: `object`[]; `completedAt?`: `Date`; `createdAt`: `Date`; `endpointId`: `string`; `eventId`: `string`; `eventType?`: [`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded); `headers`: `Record`\<`string`, `string`\>; `httpMethod`: `"POST"` \| `"PUT"` \| `"PATCH"`; `id`: `string`; `nextRetryAt?`: `Date`; `payload`: `string`; `status`: `"failed"` \| `"success"` \| `"pending"` \| `"exhausted"`; `url`: `string`; \}\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L65)

#### Parameters

##### event

[`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

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

`Promise`\<\{ `attempts`: `object`[]; `completedAt?`: `Date`; `createdAt`: `Date`; `endpointId`: `string`; `eventId`: `string`; `eventType?`: [`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded); `headers`: `Record`\<`string`, `string`\>; `httpMethod`: `"POST"` \| `"PUT"` \| `"PATCH"`; `id`: `string`; `nextRetryAt?`: `Date`; `payload`: `string`; `status`: `"failed"` \| `"success"` \| `"pending"` \| `"exhausted"`; `url`: `string`; \}\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.dispatcher.ts:278](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.dispatcher.ts#L278)

#### Returns

`Promise`\<`void`\>
