---
npm/@k-msg/provider: minor
npm/@k-msg/cli: patch
---

Accept only IWINV configs the provider can be created from. With `apiKey` optional, `k-msg config validate` and the JSON schema accepted an `iwinv` entry with no credentials or a single SMS key, and every command then failed when it created the provider. The config now needs `apiKey`, or both `smsApiKey` and `smsAuthKey`: validation reports `Set apiKey, or smsApiKey + smsAuthKey`, and the JSON schema carries the same rule as `anyOf`. The rule comes from the new `providerConfigKeyAlternatives` export of `@k-msg/provider`.
