---
npm/@k-msg/channel: patch
npm/@k-msg/messaging: patch
---

Clean up toolkit channel approval assumptions and make retry scheduling/execution explicit.

- `@k-msg/channel`
  - treat toolkit channels as already-approved local records instead of modeling fake provider approval states
  - remove toolkit channel-level verification fields and the `KakaoChannelManager.completeVerification()` flow
  - make `KakaoChannelManager` create active channels immediately and fix deleted-channel listing behavior
- `@k-msg/messaging`
  - make `JobProcessor.retryDelays` actually reschedule queued retries through queue adapters
  - change queue failure handling to use explicit retry scheduling metadata
  - redesign `MessageRetryHandler` to require an `execute(attempt, item)` callback instead of simulating retries

Note: these changes include public API and behavior changes, even though this changeset is intentionally classified as `patch`.
