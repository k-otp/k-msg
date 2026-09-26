---
npm/@k-msg/webhook: minor
---

Never send a delivery unsigned while `enableSecurity` is on. An endpoint without a `secret`, when no `secretKey` was set either, was sent to without a signature. `addEndpoint()` and `updateEndpoint()` now throw for such an endpoint, and one already stored gets a `failed` delivery, with no request, whose attempt `error` says why. `probeEndpoint()` results now include the last attempt's `error` when the probe fails.
