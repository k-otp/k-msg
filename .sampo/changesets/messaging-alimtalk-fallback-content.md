---
npm/@k-msg/messaging: minor
---

`KMsg` fills `#{variable}` placeholders in ALIMTALK `failover.fallbackContent` and `failover.fallbackTitle` from the message's `variables`, as it does for SMS text; providers used to send the placeholders as written. When `failover.fallbackChannel` is omitted, `KMsg` now sets it from the filled-in text: `lms` if it is longer than `defaults.sms.autoLmsBytes` (90 bytes), otherwise `sms`. The tracking-based API fallback follows that channel, and for a record without one it sends text over 90 bytes as LMS instead of always sending SMS.
