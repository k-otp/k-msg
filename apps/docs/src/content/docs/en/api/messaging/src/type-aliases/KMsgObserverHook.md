---
editUrl: false
next: false
prev: false
title: "KMsgObserverHook"
---

> **KMsgObserverHook** = `"onSuccess"` \| `"onError"` \| `"onQueued"` \| `"onRetryScheduled"` \| `"onFinal"`

Defined in: [packages/messaging/src/hooks.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L31)

Hooks that observe a send; see `KMsgHooks.onHookError`. `KMsg` does
not dispatch onRetryScheduled itself; a caller that does must guard it the
same way.
