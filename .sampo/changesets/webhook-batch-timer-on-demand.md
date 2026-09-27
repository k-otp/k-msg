---
npm/@k-msg/webhook: patch
---

`WebhookRuntimeService` no longer starts a timer when it is created. With `autoStart` (the default) it started a `setInterval` in the constructor even if `emit()` was never called: a Worker that built a runtime per request leaked one interval per request, and a Node.js process with a runtime never exited until `shutdown()`. The batch timer now starts when `emit()` queues an event and stops once the queue is empty, `flush()` cancels it, and `emit()` after `shutdown()` starts none. A queued event still goes out `batchTimeoutMs` after the first one was queued, or as soon as a batch that is still being sent finishes, and a full batch queued meanwhile follows that batch at once. The README explains how to use `emit()` on Cloudflare Workers: `autoStart: false` and `ctx.waitUntil(runtime.flush())`, or `emitSync()`.
