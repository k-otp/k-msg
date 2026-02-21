---
editUrl: false
next: false
prev: false
title: "KakaoChannelManager"
---

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L9)

## Constructors

### Constructor

> **new KakaoChannelManager**(): `KakaoChannelManager`

#### Returns

`KakaoChannelManager`

## Methods

### checkChannelHealth()

> **checkChannelHealth**(`channelId`): `Promise`\<\{ `isHealthy`: `boolean`; `issues`: `string`[]; `recommendations`: `string`[]; \}\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:223](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L223)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<\{ `isHealthy`: `boolean`; `issues`: `string`[]; `recommendations`: `string`[]; \}\>

***

### completeVerification()

> **completeVerification**(`channelId`, `approved`, `rejectionReason?`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L103)

#### Parameters

##### channelId

`string`

##### approved

`boolean`

##### rejectionReason?

`string`

#### Returns

`Promise`\<`void`\>

***

### createChannel()

> **createChannel**(`request`): `Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L12)

#### Parameters

##### request

[`ChannelCreateRequest`](/api/channel/src/toolkit/interfaces/channelcreaterequest/)

#### Returns

`Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>

***

### deleteChannel()

> **deleteChannel**(`channelId`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:155](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L155)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getChannel()

> **getChannel**(`channelId`): `Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/) \| `null`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L128)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/) \| `null`\>

***

### listChannels()

> **listChannels**(`filters?`): `Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)[]\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:168](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L168)

#### Parameters

##### filters?

###### status?

[`ChannelStatus`](/api/channel/src/toolkit/enumerations/channelstatus/)

###### type?

[`ChannelType`](/api/channel/src/toolkit/enumerations/channeltype/)

###### verified?

`boolean`

#### Returns

`Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)[]\>

***

### reactivateChannel()

> **reactivateChannel**(`channelId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:209](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L209)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<`void`\>

***

### suspendChannel()

> **suspendChannel**(`channelId`, `reason`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:196](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L196)

#### Parameters

##### channelId

`string`

##### reason

`string`

#### Returns

`Promise`\<`void`\>

***

### updateChannel()

> **updateChannel**(`channelId`, `updates`): `Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L132)

#### Parameters

##### channelId

`string`

##### updates

`Partial`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>

#### Returns

`Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>
