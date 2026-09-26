---
npm/@k-msg/webhook: minor
---

Add `verifyWebhookRequest(headers, body, secret, { toleranceMs })` for receivers. It checks the signature over `<X-Webhook-Timestamp>.<body>` in constant time, then rejects a signed time more than `toleranceMs` (default five minutes) from now, and returns a `Result` whose `WebhookVerificationError` has a `code` for each failed check. It reads `Headers` or Node-style header records and string, `Uint8Array` or `ArrayBuffer` bodies, and takes the sender's `algorithm`, `signatureHeader` and `signaturePrefix`.
