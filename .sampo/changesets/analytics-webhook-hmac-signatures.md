---
npm/@k-msg/analytics: minor
---

`WebhookCollector` now verifies signatures for real. It compared the signature with a placeholder built from the payload and secret lengths (`sha256=<length>_<length>`), so anyone who could guess those lengths could forge a passing signature, while a real HMAC never passed. It now checks `sha256=<hex>` (the prefix is optional) against the HMAC-SHA256 of the raw request body keyed with `secretKey`, compares the digests in constant time, and matches `signatureHeader` in any case.

Changes while `enableSignatureValidation` is on (the default):

- Pass the body exactly as received as the new `WebhookData.rawBody` (a string, `Uint8Array`, or `ArrayBuffer`). A webhook without it is rejected, because re-serializing the parsed `body` rarely reproduces the signed bytes.
- Set `secretKey`. The constructor now throws without one; before, the check was skipped and every webhook was accepted. Pass `enableSignatureValidation: false` to accept unsigned webhooks.
- An option passed as `undefined` now keeps its default, so `enableSignatureValidation: undefined` no longer turns the check off, and an undefined `maxPayloadSize` or `rateLimitPerMinute` no longer removes that limit.
