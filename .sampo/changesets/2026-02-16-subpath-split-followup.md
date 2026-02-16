---
npm/@k-msg/messaging: minor
npm/k-msg: minor
npm/@k-msg/analytics: patch
---

Restructure messaging APIs into dedicated subpaths and keep the root export send-focused.

- Move delivery-tracking APIs to `@k-msg/messaging/tracking`.
- Move bulk sender to `@k-msg/messaging/sender`.
- Move queue contracts to `@k-msg/messaging/queue` and expose `JobStatus` there.
- Remove these symbols from `@k-msg/messaging` root.
- Update `k-msg` and analytics internals to consume the new subpaths.
