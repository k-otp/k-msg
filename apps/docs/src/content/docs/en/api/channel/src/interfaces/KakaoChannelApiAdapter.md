---
editUrl: false
next: false
prev: false
title: "KakaoChannelApiAdapter"
---

Defined in: [packages/channel/src/runtime/types.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L76)

## Methods

### add()

> **add**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/types.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L82)

#### Parameters

##### params

[`KakaoChannelAddParams`](/en/api/channel/src/interfaces/kakaochanneladdparams/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### auth()

> **auth**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/types.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L81)

#### Parameters

##### params

[`KakaoChannelAuthParams`](/en/api/channel/src/interfaces/kakaochannelauthparams/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### categories()

> **categories**(): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/types.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L80)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### list()

> **list**(`params?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/channel/src/runtime/types.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/types.ts#L77)

#### Parameters

##### params?

[`KakaoChannelListParams`](/en/api/channel/src/interfaces/kakaochannellistparams/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
