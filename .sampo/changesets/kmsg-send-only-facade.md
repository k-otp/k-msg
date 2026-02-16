---
npm/k-msg: minor
---

Refocus the `k-msg` root facade on the basic send flow.

- Keep only `KMsg` exported from `k-msg`.
- Remove root re-exports of provider constructors, tracking APIs, and core utilities.
- Update docs and internal workspace usage to import advanced APIs from package-specific entry points such as `@k-msg/provider` and `@k-msg/messaging/*`.
