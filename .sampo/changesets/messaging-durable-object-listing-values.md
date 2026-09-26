---
npm/@k-msg/messaging: patch
---

The Durable Object job queue and delivery tracking store read each value from the storage listing instead of calling `get()` for every key. Reading every job or record under the prefix now costs one `list()` call per 1,000 keys. `CloudflareObjectStorage` gains an optional `entries(prefix)` that `createDurableObjectStorage` implements. KV and R2 listings carry no values, so those still read each key.
