---
npm/@k-msg/analytics: patch
npm/@k-msg/channel: patch
npm/@k-msg/template: patch
npm/@k-msg/webhook: patch
---

Build the published bundles with Bun 1.4.2 instead of 1.3.9. Bundles that inline `zod/mini` no longer carry zod's unused locale and JSON Schema modules and shrink by 65–93%: for example, the `@k-msg/template` ESM entry drops from 286 KB to 41 KB and `@k-msg/webhook` from 303 KB to 61 KB. Export names are unchanged.
