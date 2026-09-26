---
npm/@k-msg/webhook: patch
---

Sign each delivery attempt with the time it is sent. `X-Webhook-Timestamp` and the signature used the event's `timestamp`, and retries reused the first attempt's headers, so a receiver that rejects timestamps older than a few minutes also rejected retries and events that had waited in the queue. Every attempt now gets a fresh timestamp and signature, and a delivery's `headers` are those of its last attempt. An endpoint's own `headers` can no longer replace or duplicate (in another letter case) `X-Webhook-ID`, `X-Webhook-Event`, `X-Webhook-Timestamp` or the signature header, which made every delivery fail verification.
