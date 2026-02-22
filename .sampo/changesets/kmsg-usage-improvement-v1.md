---
npm/k-msg: minor
npm/@k-msg/core: minor
npm/@k-msg/messaging: minor
npm/@k-msg/provider: minor
---

Improve k-msg integration contracts for status normalization, retry policy centralization, and tracking observability.

- Add safer status normalization so unknown provider states do not get finalized as immediate failures.
- Expand retry/error utilities with policy-based classification and richer provider metadata propagation.
- Extend send hook lifecycle for queued/retry-scheduled/final outcomes.
- Add Cloudflare schema rendering options for delivery tracking index-name overrides.
- Upgrade mock provider scenarios for deterministic timeout/failure/delay testing.
