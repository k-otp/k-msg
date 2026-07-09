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

[`KakaoChannelRuntimeProvider`](/en/api/channel/src/interfaces/kakaochannelruntimeprovider/)

##### capabilityService?

[`KakaoChannelCapabilityService`](/en/api/channel/src/classes/kakaochannelcapabilityservice/) = `...`

#### Returns

`KakaoChannelLifecycleService`

## Methods

### add()

> **add**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L170)

#### Parameters

##### params

[`KakaoChannelAddParams`](/en/api/channel/src/interfaces/kakaochanneladdparams/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### auth()

> **auth**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:161](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L161)

#### Parameters

##### params

[`KakaoChannelAuthParams`](/en/api/channel/src/interfaces/kakaochannelauthparams/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### categories()

> **categories**(): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:152](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L152)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### getCapability()

> **getCapability**(): [`KakaoChannelCapability`](/en/api/channel/src/interfaces/kakaochannelcapability/)

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L71)

#### Returns

[`KakaoChannelCapability`](/en/api/channel/src/interfaces/kakaochannelcapability/)

***

### list()

> **list**(`params?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelListItem`](/en/api/channel/src/interfaces/kakaochannellistitem/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/kakao-channel-lifecycle.service.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-lifecycle.service.ts#L129)

#### Parameters

##### params?

[`KakaoChannelListParams`](/en/api/channel/src/interfaces/kakaochannellistparams/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelListItem`](/en/api/channel/src/interfaces/kakaochannellistitem/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
