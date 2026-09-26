---
npm/@k-msg/provider: minor
---

`MockProvider` implements `getDeliveryStatus`: every message it sent reports `DELIVERED` until `setDeliveryStatus(providerMessageId, status, details)` changes it, and an unknown id reports not found. Delivery tracking, examples, and tests can now run end to end without real provider credentials.
