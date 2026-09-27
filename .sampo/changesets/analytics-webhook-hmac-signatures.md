---
npm/@k-msg/analytics: minor
---

`WebhookCollector` now verifies signatures for real. It compared the signature with a placeholder built from the payload and secret lengths (`sha256=<length>_<length>`), so anyone who could guess those lengths could forge a passing signature, while a real HMAC never passed. It now checks `sha256=<hex>` (the prefix is optional) against the HMAC-SHA256 of the raw request body keyed with `secretKey`, compares the digests in constant time, and matches `signatureHeader` in any case.

Changes while `enableSignatureValidation` is on (the default):

- Pass the body exactly as received as the new `WebhookData.rawBody` (a string, `Uint8Array`, or `ArrayBuffer`). A webhook without it is rejected, because re-serializing the parsed `body` rarely reproduces the signed bytes.
- The collector parses `body` from the verified `rawBody`, which must be UTF-8 JSON, so only signed data reaches the transformers and the stored webhooks. `body` is now optional, and a value passed alongside is replaced.
- Set `secretKey` to a non-empty string. The constructor now throws without one; before, the check was skipped and every webhook was accepted. Only `enableSignatureValidation: false` accepts unsigned webhooks: `undefined`, `null`, `0`, or `""` leave the check on.

In every mode, `maxPayloadSize` now also limits `rawBody`'s size in bytes, checked before anything hashes or stores it, and `rawBody` is read once with byte bodies copied, so changing it after calling `receiveWebhook()` has no effect. Any option passed as `undefined` now keeps its default, so an undefined `maxPayloadSize` or `rateLimitPerMinute` no longer removes that limit.
