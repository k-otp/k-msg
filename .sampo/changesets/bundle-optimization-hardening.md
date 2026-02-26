---
npm/@k-msg/core: patch
npm/@k-msg/messaging: patch
npm/@k-msg/provider: patch
npm/k-msg: minor
---

optimize bundling boundaries and add lightweight core subpath

- mark core/messaging/provider/k-msg as side-effect-free for better tree shaking
- externalize workspace/runtime deps during package builds to reduce duplicated bundled payload across subpath entries
- add `k-msg/core` subpath that re-exports `@k-msg/core` without pulling `KMsg` facade into the same entrypoint
