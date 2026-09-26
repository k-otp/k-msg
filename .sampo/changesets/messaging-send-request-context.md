---
npm/@k-msg/messaging: minor
---

`KMsg.send()` and `sendOrThrow()` take an optional second argument, `{ signal, fetch }`, that is forwarded to the provider for that call, so a send can be cancelled or given a timeout (`{ signal: AbortSignal.timeout(5_000) }`) or routed through a custom `fetch`. A batch shares it. Providers already accepted this request context, but `KMsg` never passed it. The README's bulk sending section also documented a `sendMany()` method that no longer exists; it now shows `send([...])`.
