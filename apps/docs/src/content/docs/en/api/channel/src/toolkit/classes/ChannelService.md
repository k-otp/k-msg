---
editUrl: false
next: false
prev: false
title: "ChannelService"
---

Defined in: [packages/channel/src/toolkit/services/channel.service.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/services/channel.service.ts#L13)

## Constructors

### Constructor

> **new ChannelService**(): `ChannelService`

#### Returns

`ChannelService`

## Methods

### addSenderNumber()

> **addSenderNumber**(`channelId`, `phoneNumber`, `name?`): `Promise`\<`ServiceSenderNumber`\>

Defined in: [packages/channel/src/toolkit/services/channel.service.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/services/channel.service.ts#L75)

#### Parameters

##### channelId

`string`

##### phoneNumber

`string`

##### name?

`string`

#### Returns

`Promise`\<`ServiceSenderNumber`\>

***

### createChannel()

> **createChannel**(`channel`): `Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>

Defined in: [packages/channel/src/toolkit/services/channel.service.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/services/channel.service.ts#L17)

#### Parameters

##### channel

`Omit`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>

***

### deleteChannel()

> **deleteChannel**(`channelId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/services/channel.service.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/services/channel.service.ts#L64)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<`void`\>

***

### getChannel()

> **getChannel**(`channelId`): `Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/) \| `null`\>

Defined in: [packages/channel/src/toolkit/services/channel.service.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/services/channel.service.ts#L31)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/) \| `null`\>

***

### getSenderNumbers()

> **getSenderNumbers**(`channelId?`): `Promise`\<`ServiceSenderNumber`[]\>

Defined in: [packages/channel/src/toolkit/services/channel.service.ts:96](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/services/channel.service.ts#L96)

#### Parameters

##### channelId?

`string`

#### Returns

`Promise`\<`ServiceSenderNumber`[]\>

***

### listChannels()

> **listChannels**(`providerId?`): `Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)[]\>

Defined in: [packages/channel/src/toolkit/services/channel.service.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/services/channel.service.ts#L35)

#### Parameters

##### providerId?

`string`

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)[]\>

***

### updateChannel()

> **updateChannel**(`channelId`, `updates`): `Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>

Defined in: [packages/channel/src/toolkit/services/channel.service.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/services/channel.service.ts#L45)

#### Parameters

##### channelId

`string`

##### updates

`Partial`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>
