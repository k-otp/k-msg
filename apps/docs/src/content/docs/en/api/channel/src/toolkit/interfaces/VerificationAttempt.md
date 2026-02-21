---
editUrl: false
next: false
prev: false
title: "VerificationAttempt"
---

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L28)

## Properties

### attemptedAt

> **attemptedAt**: `Date`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L35)

***

### attemptNumber

> **attemptNumber**: `number`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L34)

***

### failureReason?

> `optional` **failureReason**: `string`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L38)

***

### method

> **method**: [`VerificationMethod`](/api/channel/src/toolkit/enumerations/verificationmethod/)

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L36)

***

### purpose?

> `optional` **purpose**: `"send"` \| `"verify"`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L33)

Distinguish provider/send attempts from user verification attempts.
This prevents send failures from consuming user attempt limits.

***

### responseTime?

> `optional` **responseTime**: `number`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L39)

***

### status

> **status**: `"failed"` \| `"sent"` \| `"delivered"` \| `"verified"` \| `"expired"`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L37)
