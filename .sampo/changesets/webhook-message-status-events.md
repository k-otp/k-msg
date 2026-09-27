---
npm/@k-msg/webhook: minor
---

Add `WebhookEventType.MESSAGE_CANCELLED` (`message.cancelled`) and `MESSAGE_UNKNOWN` (`message.unknown`), so every status a tracked message can move to after `PENDING` (`SENT`, `DELIVERED`, `FAILED`, `CANCELLED` and `UNKNOWN`) has a webhook event. As before, the application emits them, for example from delivery tracking's `onStatusChange`.
