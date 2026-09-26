---
npm/@k-msg/messaging: minor
---

`DeliveryTrackingService` takes an `onStatusChange` callback, called for each record a poll stored with a different status (with the record as stored and its previous status) once the poll finishes, so an app can notify a webhook or a user when a message is delivered or fails. Calls run one at a time in the order changes were stored, each with its own copy of the record. `runOnce()` resolves once its changes have been delivered, so a cron or request handler that awaits it loses none; a callback may call `runOnce()` itself, and that call resolves once the poll's changes are queued, since they are delivered after the callback. If it throws, polling continues and the error goes to `onStatusChangeError`, or `console.error` without one. Delivery is at least once: services polling the same store can each report a change, so the callback should be idempotent. The `DeliveryStatusChange` type is exported from `@k-msg/messaging/tracking`.
