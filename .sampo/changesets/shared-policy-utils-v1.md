---
npm/@k-msg/core: minor
npm/@k-msg/messaging: minor
npm/k-msg: minor
---

feat(core,messaging,k-msg): add shared policy/normalization utilities with safe defaults and opt-out modes

- core
  - expose canonical message/delivery status constants and guards
  - add terminal/pollable delivery helper utilities
  - add retry policy JSON parsing/validation helpers (`safe`/`compat`)
  - add provider error normalization helper with source trace metadata
- messaging
  - add queue send-input builder with `safe` and `unsafe_passthrough` validation modes
  - route `MessageJobProcessor` payload transformation through the shared builder
  - align tracking internals with core terminal status helpers
- k-msg facade
  - re-export new core helpers from the root package (status + policy/normalization APIs)
