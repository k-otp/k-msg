---
npm/@k-msg/provider: minor
npm/@k-msg/cli: patch
---

Allow an SMS-only `IWINVProvider`. The AlimTalk `apiKey` was required even to send SMS/LMS/MMS, which authenticate with `smsApiKey` and `smsAuthKey`. `IWINVConfig.apiKey` is now optional: a provider needs `apiKey`, or both SMS keys, and lists only the message types its keys can send. Without `apiKey`, AlimTalk sends, AlimTalk history and balance, and the template APIs fail with `INVALID_REQUEST` instead of calling IWINV with an empty `AUTH` header, and `getBalance()` defaults to the SMS balance. The CLI config schema no longer requires `apiKey` for `iwinv` entries, and the `iwinv_config_required` onboarding check now runs only in the AlimTalk preflight.
