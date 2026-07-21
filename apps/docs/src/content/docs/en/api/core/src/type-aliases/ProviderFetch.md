---
editUrl: false
next: false
prev: false
title: "ProviderFetch"
---

> **ProviderFetch** = *typeof* `globalThis.fetch`

Defined in: [packages/core/src/provider.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L22)

Fetch implementation used for a single provider operation.

Callers can inject a compatible implementation for runtime-specific
transports, tracing, or deterministic tests.
