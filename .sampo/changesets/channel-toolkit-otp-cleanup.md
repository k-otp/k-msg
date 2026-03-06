---
npm/@k-msg/channel: minor
---

Remove OTP-style verification helpers from `@k-msg/channel/toolkit`.

- Remove `NumberVerifier` and related OTP verification types from the toolkit surface.
- Remove `ChannelService.verifySenderNumber()` and the public `ChannelVerificationResult` type.
- Make `KakaoSenderNumberManager` a local sender registry that relies on explicit status and `verifiedAt` transitions instead of fake OTP issuance.
- Remove `verificationCode` from public sender-number types and refresh the generated channel docs.
