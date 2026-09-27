---
npm/@k-msg/cli: patch
---

Keep a provider's request context and transport capabilities when its config entry uses a custom id. The CLI wraps such a provider to rename it, and the wrapper's `send` dropped the `{ signal, fetch }` argument and left out `transportCapabilities`, so a provider that honors an abort signal never saw one.
