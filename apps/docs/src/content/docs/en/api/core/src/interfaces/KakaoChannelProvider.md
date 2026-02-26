---
editUrl: false
next: false
prev: false
title: "KakaoChannelProvider"
---

Defined in: [packages/core/src/provider.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L132)

Interface for providers that support Kakao channel management.

## Methods

### addKakaoChannel()?

> `optional` **addKakaoChannel**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:156](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L156)

Add a Kakao channel after authentication.

#### Parameters

##### params

###### authNum

`string`

###### categoryCode

`string`

###### phoneNumber

`string`

###### plusId

`string`

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### listKakaoChannelCategories()?

> `optional` **listKakaoChannelCategories**(): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:143](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L143)

List available channel categories for registration.

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### listKakaoChannels()

> **listKakaoChannels**(`params?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L136)

List registered Kakao channels.

#### Parameters

##### params?

###### plusId?

`string`

###### senderKey?

`string`

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### requestKakaoChannelAuth()?

> `optional` **requestKakaoChannelAuth**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:149](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L149)

Request authentication SMS for channel registration.

#### Parameters

##### params

###### phoneNumber

`string`

###### plusId

`string`

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
