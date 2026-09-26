---
npm/@k-msg/webhook: patch
---

Reject webhook field crypto modes the storage cannot honor. The registry and runtime stores always encrypt the endpoint `secret` and the delivery `payload`, which must stay recoverable, but accepted `fields: { secret: "plain" }` or `{ payload: "mask" }` and silently encrypted anyway. Each store's config must now set its field (`secret` or `payload`) to `encrypt` or `encrypt+hash`; no lookup hash is stored for them in either mode. Ciphertext written with a `tenantId` is also bound to it, so a value copied between tenants' rows does not decrypt; values written before still read.
