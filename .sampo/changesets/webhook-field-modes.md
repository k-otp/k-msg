---
npm/@k-msg/webhook: patch
---

Reject webhook field crypto modes the storage cannot honor. The registry and runtime stores always encrypt the endpoint `secret` and the delivery `payload`, which must stay recoverable, but accepted `fields: { secret: "plain" }` or `{ payload: "mask" }` and silently encrypted anyway. Only `encrypt` and `encrypt+hash` are accepted for those fields now; no lookup hash is stored for them in either mode.
