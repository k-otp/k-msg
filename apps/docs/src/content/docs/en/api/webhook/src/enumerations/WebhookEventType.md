---
editUrl: false
next: false
prev: false
title: "WebhookEventType"
---

Defined in: [packages/webhook/src/types/webhook.types.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L48)

## Enumeration Members

### ANOMALY\_DETECTED

> **ANOMALY\_DETECTED**: `"analytics.anomaly_detected"`

Defined in: [packages/webhook/src/types/webhook.types.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L83)

***

### CHANNEL\_CREATED

> **CHANNEL\_CREATED**: `"channel.created"`

Defined in: [packages/webhook/src/types/webhook.types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L71)

***

### CHANNEL\_VERIFIED

> **CHANNEL\_VERIFIED**: `"channel.verified"`

Defined in: [packages/webhook/src/types/webhook.types.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L72)

***

### MESSAGE\_CANCELLED

> **MESSAGE\_CANCELLED**: `"message.cancelled"`

Defined in: [packages/webhook/src/types/webhook.types.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L56)

The message was cancelled (delivery status `CANCELLED`).

***

### MESSAGE\_CLICKED

> **MESSAGE\_CLICKED**: `"message.clicked"`

Defined in: [packages/webhook/src/types/webhook.types.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L53)

***

### MESSAGE\_DELIVERED

> **MESSAGE\_DELIVERED**: `"message.delivered"`

Defined in: [packages/webhook/src/types/webhook.types.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L51)

***

### MESSAGE\_FAILED

> **MESSAGE\_FAILED**: `"message.failed"`

Defined in: [packages/webhook/src/types/webhook.types.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L52)

***

### MESSAGE\_READ

> **MESSAGE\_READ**: `"message.read"`

Defined in: [packages/webhook/src/types/webhook.types.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L54)

***

### MESSAGE\_SENT

> **MESSAGE\_SENT**: `"message.sent"`

Defined in: [packages/webhook/src/types/webhook.types.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L50)

***

### MESSAGE\_UNKNOWN

> **MESSAGE\_UNKNOWN**: `"message.unknown"`

Defined in: [packages/webhook/src/types/webhook.types.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L61)

Tracking ended without a final result (delivery status `UNKNOWN`), for
example when the provider has no status lookup.

***

### PROVIDER\_ERROR

> **PROVIDER\_ERROR**: `"system.provider_error"`

Defined in: [packages/webhook/src/types/webhook.types.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L79)

***

### QUOTA\_EXCEEDED

> **QUOTA\_EXCEEDED**: `"system.quota_exceeded"`

Defined in: [packages/webhook/src/types/webhook.types.ts:78](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L78)

***

### QUOTA\_WARNING

> **QUOTA\_WARNING**: `"system.quota_warning"`

Defined in: [packages/webhook/src/types/webhook.types.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L77)

***

### SENDER\_NUMBER\_ADDED

> **SENDER\_NUMBER\_ADDED**: `"sender_number.added"`

Defined in: [packages/webhook/src/types/webhook.types.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L73)

***

### SENDER\_NUMBER\_VERIFIED

> **SENDER\_NUMBER\_VERIFIED**: `"sender_number.verified"`

Defined in: [packages/webhook/src/types/webhook.types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L74)

***

### SYSTEM\_MAINTENANCE

> **SYSTEM\_MAINTENANCE**: `"system.maintenance"`

Defined in: [packages/webhook/src/types/webhook.types.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L80)

***

### TEMPLATE\_APPROVED

> **TEMPLATE\_APPROVED**: `"template.approved"`

Defined in: [packages/webhook/src/types/webhook.types.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L65)

***

### TEMPLATE\_CREATED

> **TEMPLATE\_CREATED**: `"template.created"`

Defined in: [packages/webhook/src/types/webhook.types.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L64)

***

### TEMPLATE\_DELETED

> **TEMPLATE\_DELETED**: `"template.deleted"`

Defined in: [packages/webhook/src/types/webhook.types.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L68)

***

### TEMPLATE\_REJECTED

> **TEMPLATE\_REJECTED**: `"template.rejected"`

Defined in: [packages/webhook/src/types/webhook.types.ts:66](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L66)

***

### TEMPLATE\_UPDATED

> **TEMPLATE\_UPDATED**: `"template.updated"`

Defined in: [packages/webhook/src/types/webhook.types.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L67)

***

### THRESHOLD\_EXCEEDED

> **THRESHOLD\_EXCEEDED**: `"analytics.threshold_exceeded"`

Defined in: [packages/webhook/src/types/webhook.types.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L84)
