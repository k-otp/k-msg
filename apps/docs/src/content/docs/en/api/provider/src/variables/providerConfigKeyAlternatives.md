---
editUrl: false
next: false
prev: false
title: "providerConfigKeyAlternatives"
---

> `const` **providerConfigKeyAlternatives**: `Partial`\<`Record`\<[`ProviderTypeWithConfig`](/en/api/provider/src/type-aliases/providertypewithconfig/), readonly readonly `string`[][]\>\>

Defined in: [packages/provider/src/config-fields.ts:179](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/config-fields.ts#L179)

Key sets a provider config must contain one of in full, beyond the fields
marked `required`: an IWINV config needs the AlimTalk `apiKey`, or both SMS
keys.
