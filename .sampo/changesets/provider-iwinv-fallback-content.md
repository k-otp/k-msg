---
npm/@k-msg/provider: patch
---

Send the IWINV AlimTalk fallback text that was asked for. `failover.fallbackChannel: "lms"` was mapped to IWINV's `resendType: "Y"`, which resends the AlimTalk text and ignores `resendContent`, so `failover.fallbackContent` was never sent, and `"sms"` asked for direct input even without any content. `resendType` now follows the content: `failover.fallbackContent` (or `providerOptions.resendContent`) is sent with `resendType: "N"`, and without it IWINV's default resends the AlimTalk text. IWINV chooses SMS or LMS by the text's length, so `fallbackChannel` has no IWINV field. An explicit `providerOptions.resendType: "N"` without content now fails with `INVALID_REQUEST`.
