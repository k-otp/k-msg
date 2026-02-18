---
editUrl: false
next: false
prev: false
title: "getRuntimeEnvSource"
---

> **getRuntimeEnvSource**(): [`RuntimeEnvRecord`](/api/core/src/type-aliases/runtimeenvrecord/)

Defined in: [packages/core/src/runtime/env.ts:19](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/runtime/env.ts#L19)

Resolve environment variables in a runtime-neutral order.

Priority:
1. globalThis.__K_MSG_ENV__
2. globalThis.__ENV__
3. globalThis.process?.env

## Returns

[`RuntimeEnvRecord`](/api/core/src/type-aliases/runtimeenvrecord/)
