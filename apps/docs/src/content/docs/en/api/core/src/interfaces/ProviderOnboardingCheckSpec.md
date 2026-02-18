---
editUrl: false
next: false
prev: false
title: "ProviderOnboardingCheckSpec"
---

Defined in: [packages/core/src/types/onboarding.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L29)

## Properties

### capabilityMethods?

> `optional` **capabilityMethods**: `string`[]

Defined in: [packages/core/src/types/onboarding.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L45)

Method names that must exist on provider instances.
Used when kind === "capability".

***

### configKeys?

> `optional` **configKeys**: `string`[]

Defined in: [packages/core/src/types/onboarding.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L40)

Relative key paths under provider config (e.g. "apiKey", "nested.token").
Used when kind === "config".

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types/onboarding.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L32)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types/onboarding.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L30)

***

### kind

> **kind**: [`ProviderOnboardingCheckKind`](/api/core/src/type-aliases/provideronboardingcheckkind/)

Defined in: [packages/core/src/types/onboarding.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L33)

***

### probeOperation?

> `optional` **probeOperation**: [`ProviderOnboardingProbeOperation`](/api/core/src/type-aliases/provideronboardingprobeoperation/)

Defined in: [packages/core/src/types/onboarding.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L49)

Well-known probe operation used when kind === "api_probe".

***

### scopes

> **scopes**: [`ProviderOnboardingScope`](/api/core/src/type-aliases/provideronboardingscope/)[]

Defined in: [packages/core/src/types/onboarding.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L35)

***

### severity

> **severity**: [`ProviderOnboardingSeverity`](/api/core/src/type-aliases/provideronboardingseverity/)

Defined in: [packages/core/src/types/onboarding.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L34)

***

### title

> **title**: `string`

Defined in: [packages/core/src/types/onboarding.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/onboarding.ts#L31)
