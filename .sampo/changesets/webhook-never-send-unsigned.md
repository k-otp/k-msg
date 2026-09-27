---
npm/@k-msg/webhook: minor
---

Never send a delivery unsigned while `enableSecurity` is on. An endpoint without a `secret`, when no `secretKey` was set either, was sent to without a signature. `addEndpoint()` and `updateEndpoint()` now throw for such an endpoint while it is active (an inactive one needs no secret, so it can be paused), and an active one already stored gets a `failed` delivery, with no request, whose attempt `error` says why. `probeEndpoint()` results now take `httpStatus` from the last attempt, not the first, and include its `error` when the probe fails, so a probe that was retried reports the status that decided it.
