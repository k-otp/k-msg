---
npm/@k-msg/core: minor
npm/@k-msg/messaging: minor
npm/@k-msg/webhook: minor
---

Add P1/P2 wave-3 crypto hardening and operations features:

- `@k-msg/core`
  - extend crypto metric/control signal types with circuit-state event model

- `@k-msg/messaging`
  - add `CryptoCircuitController` and control-signal configuration for delivery tracking crypto
  - emit circuit-state metrics (`crypto_circuit_state`, `crypto_circuit_open_count`) on encrypt/decrypt paths
  - add regression tests for scope-level circuit behavior

- `@k-msg/webhook`
  - apply `fieldCrypto` to runtime persistence paths (in-memory and D1 via store wrapper)
  - enforce runtime config validation for webhook `fieldCrypto` policies
  - remove legacy registry storage options `enableEncryption` / `encryptionKey`

Also update CI/docs operations:

- add docs-check retry script and CI workflow improvements for flaky canceled/timeout behavior
- add dedicated crypto regression CI job
- expand security docs (ko/en + root docs) and CLI migration docs
