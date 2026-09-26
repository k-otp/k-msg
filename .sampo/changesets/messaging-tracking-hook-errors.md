---
npm/@k-msg/messaging: minor
---

`createDeliveryTrackingHooks` reports a sent message that could not be recorded for tracking to the new `onRecordError(error, { context, result })` option. Its `onError` option used to receive those failures and failed sends alike, with no context, and without `onError` the recording failures were dropped. `onError` now receives only failed sends, as `onError(error, context)`. Without `onRecordError`, a recording failure is thrown from the hook, and `KMsg` reports it to `onHookError`, or `console.error`, without changing the send result. Move handling of recording failures from `onError` to `onRecordError`.
