---
editUrl: false
next: false
prev: false
title: "KakaoChannelApiAdapter"
---

Defined in: packages/channel/src/runtime/types.ts:76

## Methods

### add()

> **add**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/channel/src/runtime/types.ts:82

#### Parameters

##### params

[`KakaoChannelAddParams`](/api/channel/src/interfaces/kakaochanneladdparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### auth()

> **auth**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/channel/src/runtime/types.ts:81

#### Parameters

##### params

[`KakaoChannelAuthParams`](/api/channel/src/interfaces/kakaochannelauthparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### categories()

> **categories**(): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/channel/src/runtime/types.ts:80

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### list()

> **list**(`params?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/channel/src/runtime/types.ts:77

#### Parameters

##### params?

[`KakaoChannelListParams`](/api/channel/src/interfaces/kakaochannellistparams/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
