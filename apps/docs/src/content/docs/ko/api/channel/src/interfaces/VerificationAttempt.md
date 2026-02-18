---
editUrl: false
next: false
prev: false
title: "VerificationAttempt"
---

Defined in: [packages/channel/src/verification/number.verify.ts:33](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L33)

## Properties

### attemptedAt

> **attemptedAt**: `Date`

Defined in: [packages/channel/src/verification/number.verify.ts:40](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L40)

***

### attemptNumber

> **attemptNumber**: `number`

Defined in: [packages/channel/src/verification/number.verify.ts:39](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L39)

***

### failureReason?

> `optional` **failureReason**: `string`

Defined in: [packages/channel/src/verification/number.verify.ts:43](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L43)

***

### method

> **method**: [`VerificationMethod`](/api/channel/src/enumerations/verificationmethod/)

Defined in: [packages/channel/src/verification/number.verify.ts:41](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L41)

***

### purpose?

> `optional` **purpose**: `"send"` \| `"verify"`

Defined in: [packages/channel/src/verification/number.verify.ts:38](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L38)

Distinguish provider/send attempts from user verification attempts.
This prevents send failures from consuming user attempt limits.

***

### responseTime?

> `optional` **responseTime**: `number`

Defined in: [packages/channel/src/verification/number.verify.ts:44](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L44)

***

### status

> **status**: `"failed"` \| `"sent"` \| `"delivered"` \| `"verified"` \| `"expired"`

Defined in: [packages/channel/src/verification/number.verify.ts:42](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L42)
