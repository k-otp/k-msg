---
npm/@k-msg/messaging: minor
---

Errors thrown by `KMsg` observer hooks (`onSuccess`, `onError`, `onQueued`, `onRetryScheduled`, `onFinal`) no longer change the send result. Before, a throwing `onSuccess` after the provider accepted a message made `send()` report a failure and update a `full` persistence record to `FAILED`, inviting a duplicate resend. Such errors now go to the new optional `onHookError(error, { hook, context })` hook, or to `console.error` without it. `onBeforeSend` still aborts the send by throwing, and a send rejected by provider onboarding checks now ends with `onFinal` like every other failure.
