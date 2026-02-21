---
editUrl: false
next: false
prev: false
title: "VerificationAttempt"
---

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:33

## Properties

### attemptedAt

> **attemptedAt**: `Date`

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:40

***

### attemptNumber

> **attemptNumber**: `number`

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:39

***

### failureReason?

> `optional` **failureReason**: `string`

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:43

***

### method

> **method**: [`VerificationMethod`](/api/channel/src/toolkit/enumerations/verificationmethod/)

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:41

***

### purpose?

> `optional` **purpose**: `"send"` \| `"verify"`

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:38

Distinguish provider/send attempts from user verification attempts.
This prevents send failures from consuming user attempt limits.

***

### responseTime?

> `optional` **responseTime**: `number`

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:44

***

### status

> **status**: `"failed"` \| `"sent"` \| `"delivered"` \| `"verified"` \| `"expired"`

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:42
