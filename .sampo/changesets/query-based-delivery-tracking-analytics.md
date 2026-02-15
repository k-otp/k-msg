---
npm/@k-msg/messaging: patch
npm/@k-msg/analytics: patch
---

Add query-based delivery tracking analytics.

- `@k-msg/messaging`: extend `DeliveryTrackingStore` with optional query/count APIs and persist provider status/timestamps for reporting.
- `@k-msg/analytics`: add `DeliveryTrackingAnalyticsService` that computes KPIs/breakdowns by querying a `DeliveryTrackingStore` (SQLite/Bun.SQL/memory).
