---
npm/@k-msg/webhook: minor
---

Add `WebhookEventType.MESSAGE_CANCELLED` (`message.cancelled`) and `MESSAGE_UNKNOWN` (`message.unknown`), so every final delivery-tracking status (`CANCELLED` and `UNKNOWN` as well as `SENT`, `DELIVERED` and `FAILED`) has a webhook event.
