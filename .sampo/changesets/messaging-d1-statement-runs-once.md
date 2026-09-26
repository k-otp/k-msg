---
npm/@k-msg/messaging: patch
---

`createD1SqlClient` no longer runs a failed statement a second time. When `all()` threw, it ran the statement again with `run()`, which could apply a write twice or report a failed statement as successful, and without `run()` it replaced the D1 error with a generic "D1 statement execution failed". It now runs each statement once, with `all()`, and rethrows the D1 error unchanged. This affects the D1 tracking store and job queue built on it.
