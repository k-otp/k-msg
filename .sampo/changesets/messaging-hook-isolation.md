---
npm/@k-msg/messaging: minor
---

Errors thrown by `KMsg` observer hooks (`onSuccess`, `onError`, `onQueued`, `onRetryScheduled`, `onFinal`) no longer change the send result. Before, a throwing `onSuccess` after the provider accepted a message made `send()` report a failure and update a `full` persistence record to `FAILED`, inviting a duplicate resend. Such errors now go to the new optional `onHookError(error, { hook, context })` hook and are dropped without it. `onBeforeSend` still aborts the send by throwing.
