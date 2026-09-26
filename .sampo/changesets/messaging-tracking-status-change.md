---
npm/@k-msg/messaging: minor
---

`DeliveryTrackingService` takes an `onStatusChange` callback, called once each time a poll stores a different status for a record (with the stored record and its previous status), so an app can notify a webhook or a user when a message is delivered or fails. If it throws, the poll continues and the error goes to `onStatusChangeError`, or `console.error` without one. The `DeliveryStatusChange` type is exported from `@k-msg/messaging/tracking`.
