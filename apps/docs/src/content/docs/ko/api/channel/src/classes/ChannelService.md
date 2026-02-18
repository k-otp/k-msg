---
editUrl: false
next: false
prev: false
title: "ChannelService"
---

Defined in: [packages/channel/src/services/channel.service.ts:17](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L17)

## Constructors

### Constructor

> **new ChannelService**(): `ChannelService`

#### Returns

`ChannelService`

## Methods

### addSenderNumber()

> **addSenderNumber**(`channelId`, `phoneNumber`, `name?`): `Promise`\<`ServiceSenderNumber`\>

Defined in: [packages/channel/src/services/channel.service.ts:79](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L79)

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

> **createChannel**(`channel`): `Promise`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/)\>

Defined in: [packages/channel/src/services/channel.service.ts:21](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L21)

#### Parameters

##### channel

`Omit`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/)\>

***

### deleteChannel()

> **deleteChannel**(`channelId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/services/channel.service.ts:68](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L68)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<`void`\>

***

### getChannel()

> **getChannel**(`channelId`): `Promise`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/) \| `null`\>

Defined in: [packages/channel/src/services/channel.service.ts:35](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L35)

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/) \| `null`\>

***

### getSenderNumbers()

> **getSenderNumbers**(`channelId?`): `Promise`\<`ServiceSenderNumber`[]\>

Defined in: [packages/channel/src/services/channel.service.ts:127](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L127)

#### Parameters

##### channelId?

`string`

#### Returns

`Promise`\<`ServiceSenderNumber`[]\>

***

### listChannels()

> **listChannels**(`providerId?`): `Promise`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/)[]\>

Defined in: [packages/channel/src/services/channel.service.ts:39](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L39)

#### Parameters

##### providerId?

`string`

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/)[]\>

***

### updateChannel()

> **updateChannel**(`channelId`, `updates`): `Promise`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/)\>

Defined in: [packages/channel/src/services/channel.service.ts:49](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L49)

#### Parameters

##### channelId

`string`

##### updates

`Partial`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/)\>

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/interfaces/channelconfig/)\>

***

### verifySenderNumber()

> **verifySenderNumber**(`phoneNumber`): `Promise`\<[`ChannelVerificationResult`](/api/channel/src/interfaces/channelverificationresult/)\>

Defined in: [packages/channel/src/services/channel.service.ts:100](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/services/channel.service.ts#L100)

#### Parameters

##### phoneNumber

`string`

#### Returns

`Promise`\<[`ChannelVerificationResult`](/api/channel/src/interfaces/channelverificationresult/)\>
