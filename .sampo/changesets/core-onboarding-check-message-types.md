---
npm/@k-msg/core: minor
npm/@k-msg/provider: patch
npm/@k-msg/cli: patch
---

Let onboarding checks name the message types they prepare for. `ProviderOnboardingCheckSpec.messageTypes` is a new optional field, and `k-msg providers doctor` skips a check that names only types the provider cannot send, reporting it as not applicable. The IWINV Kakao channel, template capability and template list checks declare `["ALIMTALK"]`, so an SMS-only IWINV configuration no longer fails `doctor` on the Kakao channel prerequisite. `k-msg alimtalk preflight` still evaluates every AlimTalk check.
