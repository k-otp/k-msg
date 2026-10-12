---
editUrl: false
next: false
prev: false
title: "WebhookEventType"
---

Defined in: [packages/webhook/src/types/webhook.types.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L63)

## Enumeration Members

### ANOMALY\_DETECTED

> **ANOMALY\_DETECTED**: `"analytics.anomaly_detected"`

Defined in: [packages/webhook/src/types/webhook.types.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L98)

***

### CHANNEL\_CREATED

> **CHANNEL\_CREATED**: `"channel.created"`

Defined in: [packages/webhook/src/types/webhook.types.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L86)

***

### CHANNEL\_VERIFIED

> **CHANNEL\_VERIFIED**: `"channel.verified"`

Defined in: [packages/webhook/src/types/webhook.types.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L87)

***

### MESSAGE\_CANCELLED

> **MESSAGE\_CANCELLED**: `"message.cancelled"`

Defined in: [packages/webhook/src/types/webhook.types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L71)

The message was cancelled (delivery status `CANCELLED`).

***

### MESSAGE\_CLICKED

> **MESSAGE\_CLICKED**: `"message.clicked"`

Defined in: [packages/webhook/src/types/webhook.types.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L68)

***

### MESSAGE\_DELIVERED

> **MESSAGE\_DELIVERED**: `"message.delivered"`

Defined in: [packages/webhook/src/types/webhook.types.ts:66](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L66)

***

### MESSAGE\_FAILED

> **MESSAGE\_FAILED**: `"message.failed"`

Defined in: [packages/webhook/src/types/webhook.types.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L67)

***

### MESSAGE\_READ

> **MESSAGE\_READ**: `"message.read"`

Defined in: [packages/webhook/src/types/webhook.types.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L69)

***

### MESSAGE\_SENT

> **MESSAGE\_SENT**: `"message.sent"`

Defined in: [packages/webhook/src/types/webhook.types.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L65)

***

### MESSAGE\_UNKNOWN

> **MESSAGE\_UNKNOWN**: `"message.unknown"`

Defined in: [packages/webhook/src/types/webhook.types.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L76)

Tracking ended without a final result (delivery status `UNKNOWN`), for
example when the provider has no status lookup.

***

### PROVIDER\_ERROR

> **PROVIDER\_ERROR**: `"system.provider_error"`

Defined in: [packages/webhook/src/types/webhook.types.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L94)

***

### QUOTA\_EXCEEDED

> **QUOTA\_EXCEEDED**: `"system.quota_exceeded"`

Defined in: [packages/webhook/src/types/webhook.types.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L93)

***

### QUOTA\_WARNING

> **QUOTA\_WARNING**: `"system.quota_warning"`

Defined in: [packages/webhook/src/types/webhook.types.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L92)

***

### SENDER\_NUMBER\_ADDED

> **SENDER\_NUMBER\_ADDED**: `"sender_number.added"`

Defined in: [packages/webhook/src/types/webhook.types.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L88)

***

### SENDER\_NUMBER\_VERIFIED

> **SENDER\_NUMBER\_VERIFIED**: `"sender_number.verified"`

Defined in: [packages/webhook/src/types/webhook.types.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L89)

***

### SYSTEM\_MAINTENANCE

> **SYSTEM\_MAINTENANCE**: `"system.maintenance"`

Defined in: [packages/webhook/src/types/webhook.types.ts:95](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L95)

***

### TEMPLATE\_APPROVED

> **TEMPLATE\_APPROVED**: `"template.approved"`

Defined in: [packages/webhook/src/types/webhook.types.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L80)

***

### TEMPLATE\_CREATED

> **TEMPLATE\_CREATED**: `"template.created"`

Defined in: [packages/webhook/src/types/webhook.types.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L79)

***

### TEMPLATE\_DELETED

> **TEMPLATE\_DELETED**: `"template.deleted"`

Defined in: [packages/webhook/src/types/webhook.types.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L83)

***

### TEMPLATE\_REJECTED

> **TEMPLATE\_REJECTED**: `"template.rejected"`

Defined in: [packages/webhook/src/types/webhook.types.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L81)

***

### TEMPLATE\_UPDATED

> **TEMPLATE\_UPDATED**: `"template.updated"`

Defined in: [packages/webhook/src/types/webhook.types.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L82)

***

### THRESHOLD\_EXCEEDED

> **THRESHOLD\_EXCEEDED**: `"analytics.threshold_exceeded"`

Defined in: [packages/webhook/src/types/webhook.types.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L99)
