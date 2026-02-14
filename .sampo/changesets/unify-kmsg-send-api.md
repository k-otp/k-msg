---
npm/k-msg: minor
npm/@k-msg/core: minor
npm/@k-msg/messaging: minor
npm/@k-msg/provider: minor
npm/@k-msg/template: minor
npm/@k-msg/analytics: minor
npm/@k-msg/channel: minor
npm/@k-msg/webhook: minor
---

Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.

- Remove legacy Platform/UniversalProvider/StandardRequest public APIs
- Rename `templateId` -> `templateCode`, and message discriminant to `type`
- Refactor built-in providers to the unified `SendOptions + Result` interface

