---
npm/@k-msg/provider: patch
---

Document that Aligo has no delivery status lookup. `AligoProvider` implements no `getDeliveryStatus()`: Aligo has result lookup APIs but does not publish the result codes they return. `DeliveryTrackingService` therefore keeps tracked Aligo messages at `SENT` until `polling.maxTrackingDurationMs` (24 h by default) marks them `UNKNOWN`, and `polling.unsupportedProviderStrategy: "unknown"` settles them at the first poll. The provider README now lists which providers support delivery status lookup, and the Aligo onboarding spec notes the limitation.
