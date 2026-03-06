---
editUrl: false
next: false
prev: false
title: "KakaoChannelManager"
---

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L8)

## Constructors

### Constructor

> **new KakaoChannelManager**(): `KakaoChannelManager`

#### Returns

`KakaoChannelManager`

## Methods

### checkChannelHealth()

> **checkChannelHealth**(`channelId`): `Promise`\<\{ `isHealthy`: `boolean`; `issues`: `string`[]; `recommendations`: `string`[]; \}\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L167)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<\{ `isHealthy`: `boolean`; `issues`: `string`[]; `recommendations`: `string`[]; \}\>

***

### createChannel()

> **createChannel**(`request`): `Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L11)

#### Parameters

##### request

[`ChannelCreateRequest`](/api/channel/src/toolkit/interfaces/channelcreaterequest/)

#### Returns

`Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>

***

### deleteChannel()

> **deleteChannel**(`channelId`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:104](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L104)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getChannel()

> **getChannel**(`channelId`): `Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/) \| `null`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L77)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/) \| `null`\>

***

### listChannels()

> **listChannels**(`filters?`): `Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)[]\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:117](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L117)

#### Parameters

##### filters?

###### status?

[`ChannelStatus`](/api/channel/src/toolkit/enumerations/channelstatus/)

###### type?

[`ChannelType`](/api/channel/src/toolkit/enumerations/channeltype/)

#### Returns

`Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)[]\>

***

### reactivateChannel()

> **reactivateChannel**(`channelId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:153](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L153)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<`void`\>

***

### suspendChannel()

> **suspendChannel**(`channelId`, `reason`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:140](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L140)

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

Defined in: [packages/channel/src/toolkit/kakao/channel.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/channel.ts#L81)

#### Parameters

##### channelId

`string`

##### updates

`Partial`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>

#### Returns

`Promise`\<[`Channel`](/api/channel/src/toolkit/interfaces/channel/)\>
