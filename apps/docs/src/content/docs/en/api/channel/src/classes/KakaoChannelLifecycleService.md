---
editUrl: false
next: false
prev: false
title: "KakaoChannelLifecycleService"
---

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L48)

## Constructors

### Constructor

> **new KakaoChannelLifecycleService**(`provider`, `capabilityService?`): `KakaoChannelLifecycleService`

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L55)

#### Parameters

##### provider

[`KakaoChannelRuntimeProvider`](/api/channel/src/interfaces/kakaochannelruntimeprovider/)

##### capabilityService?

[`KakaoChannelCapabilityService`](/api/channel/src/classes/kakaochannelcapabilityservice/) = `...`

#### Returns

`KakaoChannelLifecycleService`

## Methods

### add()

> **add**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L170)

#### Parameters

##### params

[`KakaoChannelAddParams`](/api/channel/src/interfaces/kakaochanneladdparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### auth()

> **auth**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:161](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L161)

#### Parameters

##### params

[`KakaoChannelAuthParams`](/api/channel/src/interfaces/kakaochannelauthparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### categories()

> **categories**(): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:152](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L152)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### getCapability()

> **getCapability**(): [`KakaoChannelCapability`](/api/channel/src/interfaces/kakaochannelcapability/)

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L71)

#### Returns

[`KakaoChannelCapability`](/api/channel/src/interfaces/kakaochannelcapability/)

***

### list()

> **list**(`params?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelListItem`](/api/channel/src/interfaces/kakaochannellistitem/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L129)

#### Parameters

##### params?

[`KakaoChannelListParams`](/api/channel/src/interfaces/kakaochannellistparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelListItem`](/api/channel/src/interfaces/kakaochannellistitem/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
