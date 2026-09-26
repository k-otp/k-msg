---
editUrl: false
next: false
prev: false
title: "WebhookEventType"
---

Defined in: [packages/webhook/src/types/webhook.types.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L39)

## Enumeration Members

### ANOMALY\_DETECTED

> **ANOMALY\_DETECTED**: `"analytics.anomaly_detected"`

Defined in: [packages/webhook/src/types/webhook.types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L74)

***

### CHANNEL\_CREATED

> **CHANNEL\_CREATED**: `"channel.created"`

Defined in: [packages/webhook/src/types/webhook.types.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L62)

***

### CHANNEL\_VERIFIED

> **CHANNEL\_VERIFIED**: `"channel.verified"`

Defined in: [packages/webhook/src/types/webhook.types.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L63)

***

### MESSAGE\_CANCELLED

> **MESSAGE\_CANCELLED**: `"message.cancelled"`

Defined in: [packages/webhook/src/types/webhook.types.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L47)

The message was cancelled (delivery status `CANCELLED`).

***

### MESSAGE\_CLICKED

> **MESSAGE\_CLICKED**: `"message.clicked"`

Defined in: [packages/webhook/src/types/webhook.types.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L44)

***

### MESSAGE\_DELIVERED

> **MESSAGE\_DELIVERED**: `"message.delivered"`

Defined in: [packages/webhook/src/types/webhook.types.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L42)

***

### MESSAGE\_FAILED

> **MESSAGE\_FAILED**: `"message.failed"`

Defined in: [packages/webhook/src/types/webhook.types.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L43)

***

### MESSAGE\_READ

> **MESSAGE\_READ**: `"message.read"`

Defined in: [packages/webhook/src/types/webhook.types.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L45)

***

### MESSAGE\_SENT

> **MESSAGE\_SENT**: `"message.sent"`

Defined in: [packages/webhook/src/types/webhook.types.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L41)

***

### MESSAGE\_UNKNOWN

> **MESSAGE\_UNKNOWN**: `"message.unknown"`

Defined in: [packages/webhook/src/types/webhook.types.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L52)

Tracking ended without a final result (delivery status `UNKNOWN`), for
example when the provider has no status lookup.

***

### PROVIDER\_ERROR

> **PROVIDER\_ERROR**: `"system.provider_error"`

Defined in: [packages/webhook/src/types/webhook.types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L70)

***

### QUOTA\_EXCEEDED

> **QUOTA\_EXCEEDED**: `"system.quota_exceeded"`

Defined in: [packages/webhook/src/types/webhook.types.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L69)

***

### QUOTA\_WARNING

> **QUOTA\_WARNING**: `"system.quota_warning"`

Defined in: [packages/webhook/src/types/webhook.types.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L68)

***

### SENDER\_NUMBER\_ADDED

> **SENDER\_NUMBER\_ADDED**: `"sender_number.added"`

Defined in: [packages/webhook/src/types/webhook.types.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L64)

***

### SENDER\_NUMBER\_VERIFIED

> **SENDER\_NUMBER\_VERIFIED**: `"sender_number.verified"`

Defined in: [packages/webhook/src/types/webhook.types.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L65)

***

### SYSTEM\_MAINTENANCE

> **SYSTEM\_MAINTENANCE**: `"system.maintenance"`

Defined in: [packages/webhook/src/types/webhook.types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L71)

***

### TEMPLATE\_APPROVED

> **TEMPLATE\_APPROVED**: `"template.approved"`

Defined in: [packages/webhook/src/types/webhook.types.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L56)

***

### TEMPLATE\_CREATED

> **TEMPLATE\_CREATED**: `"template.created"`

Defined in: [packages/webhook/src/types/webhook.types.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L55)

***

### TEMPLATE\_DELETED

> **TEMPLATE\_DELETED**: `"template.deleted"`

Defined in: [packages/webhook/src/types/webhook.types.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L59)

***

### TEMPLATE\_REJECTED

> **TEMPLATE\_REJECTED**: `"template.rejected"`

Defined in: [packages/webhook/src/types/webhook.types.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L57)

***

### TEMPLATE\_UPDATED

> **TEMPLATE\_UPDATED**: `"template.updated"`

Defined in: [packages/webhook/src/types/webhook.types.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L58)

***

### THRESHOLD\_EXCEEDED

> **THRESHOLD\_EXCEEDED**: `"analytics.threshold_exceeded"`

Defined in: [packages/webhook/src/types/webhook.types.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L75)
