---
editUrl: false
next: false
prev: false
title: "KakaoChannelRuntimeProvider"
---

Defined in: [packages/channel/src/runtime/types.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L59)

## Properties

### addKakaoChannel()?

> `optional` **addKakaoChannel**: (`params`) => `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L71)

#### Parameters

##### params

[`KakaoChannelAddParams`](/api/channel/src/interfaces/kakaochanneladdparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### getOnboardingSpec()?

> `optional` **getOnboardingSpec**: () => [`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/channel/src/runtime/types.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L61)

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

***

### id

> **id**: `string`

Defined in: [packages/channel/src/runtime/types.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L60)

***

### listKakaoChannelCategories()?

> `optional` **listKakaoChannelCategories**: () => `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/types.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L65)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### listKakaoChannels()?

> `optional` **listKakaoChannels**: (`params?`) => `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/types.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L62)

#### Parameters

##### params?

[`KakaoChannelListParams`](/api/channel/src/interfaces/kakaochannellistparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### requestKakaoChannelAuth()?

> `optional` **requestKakaoChannelAuth**: (`params`) => `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/types.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L68)

#### Parameters

##### params

[`KakaoChannelAuthParams`](/api/channel/src/interfaces/kakaochannelauthparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
