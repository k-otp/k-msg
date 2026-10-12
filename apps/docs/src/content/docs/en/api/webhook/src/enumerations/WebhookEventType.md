---
editUrl: false
next: false
prev: false
title: "WebhookEventType"
---

Defined in: [packages/webhook/src/types/webhook.types.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L53)

## Enumeration Members

### ANOMALY\_DETECTED

> **ANOMALY\_DETECTED**: `"analytics.anomaly_detected"`

Defined in: [packages/webhook/src/types/webhook.types.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L88)

***

### CHANNEL\_CREATED

> **CHANNEL\_CREATED**: `"channel.created"`

Defined in: [packages/webhook/src/types/webhook.types.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L76)

***

### CHANNEL\_VERIFIED

> **CHANNEL\_VERIFIED**: `"channel.verified"`

Defined in: [packages/webhook/src/types/webhook.types.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L77)

***

### MESSAGE\_CANCELLED

> **MESSAGE\_CANCELLED**: `"message.cancelled"`

Defined in: [packages/webhook/src/types/webhook.types.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L61)

The message was cancelled (delivery status `CANCELLED`).

***

### MESSAGE\_CLICKED

> **MESSAGE\_CLICKED**: `"message.clicked"`

Defined in: [packages/webhook/src/types/webhook.types.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L58)

***

### MESSAGE\_DELIVERED

> **MESSAGE\_DELIVERED**: `"message.delivered"`

Defined in: [packages/webhook/src/types/webhook.types.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L56)

***

### MESSAGE\_FAILED

> **MESSAGE\_FAILED**: `"message.failed"`

Defined in: [packages/webhook/src/types/webhook.types.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L57)

***

### MESSAGE\_READ

> **MESSAGE\_READ**: `"message.read"`

Defined in: [packages/webhook/src/types/webhook.types.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L59)

***

### MESSAGE\_SENT

> **MESSAGE\_SENT**: `"message.sent"`

Defined in: [packages/webhook/src/types/webhook.types.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L55)

***

### MESSAGE\_UNKNOWN

> **MESSAGE\_UNKNOWN**: `"message.unknown"`

Defined in: [packages/webhook/src/types/webhook.types.ts:66](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L66)

Tracking ended without a final result (delivery status `UNKNOWN`), for
example when the provider has no status lookup.

***

### PROVIDER\_ERROR

> **PROVIDER\_ERROR**: `"system.provider_error"`

Defined in: [packages/webhook/src/types/webhook.types.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L84)

***

### QUOTA\_EXCEEDED

> **QUOTA\_EXCEEDED**: `"system.quota_exceeded"`

Defined in: [packages/webhook/src/types/webhook.types.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L83)

***

### QUOTA\_WARNING

> **QUOTA\_WARNING**: `"system.quota_warning"`

Defined in: [packages/webhook/src/types/webhook.types.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L82)

***

### SENDER\_NUMBER\_ADDED

> **SENDER\_NUMBER\_ADDED**: `"sender_number.added"`

Defined in: [packages/webhook/src/types/webhook.types.ts:78](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L78)

***

### SENDER\_NUMBER\_VERIFIED

> **SENDER\_NUMBER\_VERIFIED**: `"sender_number.verified"`

Defined in: [packages/webhook/src/types/webhook.types.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L79)

***

### SYSTEM\_MAINTENANCE

> **SYSTEM\_MAINTENANCE**: `"system.maintenance"`

Defined in: [packages/webhook/src/types/webhook.types.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L85)

***

### TEMPLATE\_APPROVED

> **TEMPLATE\_APPROVED**: `"template.approved"`

Defined in: [packages/webhook/src/types/webhook.types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L70)

***

### TEMPLATE\_CREATED

> **TEMPLATE\_CREATED**: `"template.created"`

Defined in: [packages/webhook/src/types/webhook.types.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L69)

***

### TEMPLATE\_DELETED

> **TEMPLATE\_DELETED**: `"template.deleted"`

Defined in: [packages/webhook/src/types/webhook.types.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L73)

***

### TEMPLATE\_REJECTED

> **TEMPLATE\_REJECTED**: `"template.rejected"`

Defined in: [packages/webhook/src/types/webhook.types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L71)

***

### TEMPLATE\_UPDATED

> **TEMPLATE\_UPDATED**: `"template.updated"`

Defined in: [packages/webhook/src/types/webhook.types.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L72)

***

### THRESHOLD\_EXCEEDED

> **THRESHOLD\_EXCEEDED**: `"analytics.threshold_exceeded"`

Defined in: [packages/webhook/src/types/webhook.types.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L89)
