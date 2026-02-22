---
npm/@k-msg/core: minor
npm/@k-msg/messaging: minor
---

Add P1 key-management abstraction for field crypto:

- add `createEnvKeyResolver`, `createAwsKmsKeyResolver`, `createVaultTransitKeyResolver`
- add rollout policy helpers (`ActiveKidRolloutPolicy`, deterministic bucket selection)
- add `createRollingKeyResolver` for active-kid gradual rollout while keeping multi-kid decrypt safety
- expand tracking decrypt candidate resolution to include ciphertext envelope `kid`

