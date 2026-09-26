---
npm/@k-msg/messaging: minor
---

`DeliveryTrackingService` takes an `onStatusChange` callback, called for each record a poll stored with a different status (with the record as stored and its previous status) once the poll finishes, so an app can notify a webhook or a user when a message is delivered or fails. It may call `runOnce()` itself. If it throws, polling continues and the error goes to `onStatusChangeError`, or `console.error` without one. Delivery is at least once: services polling the same store can each report a change, so the callback should be idempotent. The `DeliveryStatusChange` type is exported from `@k-msg/messaging/tracking`.
