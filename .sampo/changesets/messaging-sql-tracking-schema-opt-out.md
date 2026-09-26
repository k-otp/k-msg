---
npm/@k-msg/messaging: minor
---

SQL delivery tracking stores take `initializeSchema: false` to skip creating their table and indexes. `HyperdriveDeliveryTrackingStore`, `createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `SqliteDeliveryTrackingStore`, and `BunSqlDeliveryTrackingStore` ran four `CREATE ... IF NOT EXISTS` statements before the first query of every new store, which in a Worker means every request, and needed a role allowed to run DDL. With the option set, `init()` does nothing and the schema is left to migrations, as `createD1WebhookPersistence` already allowed.
