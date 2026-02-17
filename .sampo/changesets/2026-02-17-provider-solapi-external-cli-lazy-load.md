---
npm/@k-msg/provider: minor
npm/@k-msg/messaging: patch
npm/@k-msg/webhook: patch
npm/@k-msg/cli: patch
---

Improve package boundaries and runtime safety across provider/messaging/cli:

- Make package builds deterministic by running `clean` before each build pipeline.
- Remove stale/unused dependencies and TS references in messaging/webhook/provider.
- Add `@k-msg/provider/aligo` subpath export and keep `@k-msg/provider/solapi` as a dedicated subpath.
- Externalize `solapi` from provider dist output while keeping it as optional peer dependency.
- Update CLI provider registry to lazy-load SOLAPI only when configured, with clear install guidance when missing.
- Remove unsafe `any` casting from CLI provider capability wiring and add registry boundary tests.
