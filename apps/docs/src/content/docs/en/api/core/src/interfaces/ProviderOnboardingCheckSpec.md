---
editUrl: false
next: false
prev: false
title: "ProviderOnboardingCheckSpec"
---

Defined in: [packages/core/src/types/onboarding.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L31)

## Properties

### capabilityMethods?

> `optional` **capabilityMethods?**: `string`[]

Defined in: [packages/core/src/types/onboarding.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L47)

Method names that must exist on provider instances.
Used when kind === "capability".

***

### configKeys?

> `optional` **configKeys?**: `string`[]

Defined in: [packages/core/src/types/onboarding.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L42)

Relative key paths under provider config (e.g. "apiKey", "nested.token").
Used when kind === "config".

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/core/src/types/onboarding.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L34)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types/onboarding.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L32)

***

### kind

> **kind**: [`ProviderOnboardingCheckKind`](/en/api/core/src/type-aliases/provideronboardingcheckkind/)

Defined in: [packages/core/src/types/onboarding.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L35)

***

### messageTypes?

> `optional` **messageTypes?**: [`MessageType`](/en/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/core/src/types/onboarding.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L57)

Message types the check prepares for. When set, `doctor` evaluates it only
for a provider that supports one of them, so an SMS-only configuration is
not held to AlimTalk prerequisites.

***

### probeOperation?

> `optional` **probeOperation?**: [`ProviderOnboardingProbeOperation`](/en/api/core/src/type-aliases/provideronboardingprobeoperation/)

Defined in: [packages/core/src/types/onboarding.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L51)

Well-known probe operation used when kind === "api_probe".

***

### scopes

> **scopes**: [`ProviderOnboardingScope`](/en/api/core/src/type-aliases/provideronboardingscope/)[]

Defined in: [packages/core/src/types/onboarding.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L37)

***

### severity

> **severity**: [`ProviderOnboardingSeverity`](/en/api/core/src/type-aliases/provideronboardingseverity/)

Defined in: [packages/core/src/types/onboarding.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L36)

***

### title

> **title**: `string`

Defined in: [packages/core/src/types/onboarding.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L33)
