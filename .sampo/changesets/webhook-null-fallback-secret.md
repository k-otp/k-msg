---
npm/@k-msg/webhook: patch
---

Stop storing a plaintext endpoint secret when encryption fails open with the `null` fallback. With `failMode: "open"` and `openFallback: "null"`, the empty fallback value was ignored and the endpoint kept its original secret, so the `WebhookRuntimeService` stores and `WebhookRegistry` persisted it in plaintext during a key service outage. Such an endpoint is now stored without a secret, and an endpoint whose secret cannot be decrypted under that fallback is returned without one instead of with its ciphertext.
