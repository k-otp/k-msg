---
"npm/@k-msg/messaging": patch
---

Fix delivery tracking schema option typing compatibility.

- Accept legacy `trackingTypeStrategy` input in schema/config paths that previously switched to `typeStrategy`.
- Ensure `createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `initializeCloudflareSqlSchema`, and drizzle SQL render helpers honor both option keys.
- This preserves backward compatibility for existing consumers while keeping the new `typeStrategy` API.
