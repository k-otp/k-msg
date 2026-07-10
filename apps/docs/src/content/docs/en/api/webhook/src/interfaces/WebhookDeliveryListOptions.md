---
editUrl: false
next: false
prev: false
title: "WebhookDeliveryListOptions"
---

Defined in: [packages/webhook/src/runtime/types.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L11)

## Properties

### endpointId?

> `optional` **endpointId?**: `string`

Defined in: [packages/webhook/src/runtime/types.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L12)

***

### eventType?

> `optional` **eventType?**: [`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded)

Defined in: [packages/webhook/src/runtime/types.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L13)

***

### limit?

> `optional` **limit?**: `number`

Defined in: [packages/webhook/src/runtime/types.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L15)

***

### status?

> `optional` **status?**: `"failed"` \| `"success"` \| `"pending"` \| `"exhausted"`

Defined in: [packages/webhook/src/runtime/types.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L14)
