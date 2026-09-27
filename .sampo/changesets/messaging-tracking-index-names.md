---
npm/@k-msg/messaging: patch
---

SQL delivery tracking stores create their indexes under the names set in `indexNames` or `trackingIndexNames`. `HyperdriveDeliveryTrackingStore.init()` always used the default `idx_kmsg_delivery_*` names, and `createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, and `BunSqlDeliveryTrackingStore` dropped both options. Index names are unique per database in SQLite and D1 and per schema in Postgres, so a second tracking table there got no indexes at all. Existing indexes are left in place: where an earlier version created the default-named indexes for a store with custom names, `init()` now adds the configured ones next to them, which makes the default-named ones on that table redundant.
