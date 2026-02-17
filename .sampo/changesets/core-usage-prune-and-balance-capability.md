---
npm/@k-msg/core: minor
npm/@k-msg/provider: minor
npm/@k-msg/analytics: minor
npm/@k-msg/webhook: minor
npm/k-msg: minor
---

Reorganize low-usage core APIs and expand real internal usage paths.

- Removed `@k-msg/core` low-usage APIs: `config`, `health`, `types/history`, and high-level resilience helpers (`ErrorRecovery`, `GracefulDegradation`, `HealthMonitor`).
- Added optional provider capability `BalanceProvider#getBalance(query?)` and implemented it in:
  - `IWINVProvider` (`ALIMTALK` default + `SMS/LMS/MMS` charge lookup)
  - `SolapiProvider` (single balance model mapped to `BalanceResult`)
- Standardized analytics runtime logging to `@k-msg/core` logger (`console.*` removal in runtime paths).
- Removed `apps/admin-dashboard` and `apps/message-service` from the monorepo.

Note: This includes behavior/interface removals that can be considered breaking, but this release is intentionally marked as `minor` per current release policy request.
