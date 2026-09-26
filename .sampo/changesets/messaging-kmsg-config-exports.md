---
npm/@k-msg/messaging: minor
npm/k-msg: minor
---

`@k-msg/messaging` exports the `KMsgConfig`, `KMsgRoutingConfig`, `KMsgDefaultsConfig`, and `RoutingStrategy` types, so configuration built outside the `KMsg` constructor can be typed, and `estimateSmsBytes(text)`, which counts bytes the way `KMsg` does to choose between SMS and LMS (one per ASCII character, two per other character). The `k-msg` facade re-exports the three config types and `estimateSmsBytes`, and the `DeliveryStatus` type from `@k-msg/core`.
