---
editUrl: false
next: false
prev: false
title: "WebhookDeliveryStore"
---

Defined in: [packages/webhook/src/runtime/types.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L26)

## Methods

### add()

> **add**(`delivery`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/runtime/types.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L27)

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

### list()

> **list**(`options?`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/runtime/types.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L28)

#### Parameters

##### options?

[`WebhookDeliveryListOptions`](/en/api/webhook/src/interfaces/webhookdeliverylistoptions/)

#### Returns

`Promise`\<`object`[]\>
