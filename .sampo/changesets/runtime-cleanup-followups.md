---
npm/@k-msg/channel: patch
npm/@k-msg/messaging: patch
---

Fix follow-up runtime issues in the channel toolkit and messaging queue helpers.

- Prevent `JobProcessor` from leaving processing slots stuck when a job type has no registered handler.
- Make queue cleanup remove only terminal jobs instead of deleting pending work, and align queue-size metrics with the actual pending queue.
- Remove deleted channel sender-number orphans during `ChannelCRUD` cleanup.
- Remove the unused `MessageRetryHandler.enablePersistence` option and update the docs to match the real in-memory behavior.
