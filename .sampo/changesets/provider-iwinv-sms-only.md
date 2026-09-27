---
npm/@k-msg/provider: minor
npm/@k-msg/cli: patch
---

Allow an SMS-only `IWINVProvider`. The AlimTalk `apiKey` was required even to send SMS/LMS/MMS, which authenticate with `smsApiKey` and `smsAuthKey`. `IWINVConfig.apiKey` is now optional: a provider needs `apiKey`, or both SMS keys, and lists only the message types its keys can send. Without `apiKey`, AlimTalk sends, AlimTalk history and balance, and the template APIs fail with `INVALID_REQUEST`, and `getBalance()` defaults to the SMS balance.

In the CLI, an `iwinv` entry needs `apiKey`, or both `smsApiKey` and `smsAuthKey` (`Set apiKey, or smsApiKey + smsAuthKey`; `anyOf` in the JSON schema, from the new `providerConfigKeyAlternatives` export), and the `iwinv_config_required` onboarding check runs only in the AlimTalk preflight. Routes seeded by `config provider add` and `config init` follow each entry's credentials, through the new optional `ProviderCliMetadata.routingSeedTypesForConfig`. Those commands fill in `apiKey: "env:IWINV_API_KEY"` by default, so for SMS-only use remove `apiKey` and the entry's `ALIMTALK` route from the config.
