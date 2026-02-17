---
"@k-msg/core": minor
"@k-msg/messaging": minor
"k-msg": minor
---

Unify `KMsg.send` for single and batch inputs with built-in chunking, add configurable persistence strategies (`none`, `log`, `queue`, `full`) via a new message repository contract, and migrate bulk sending internals off `sendMany` to the unified `send` API.
