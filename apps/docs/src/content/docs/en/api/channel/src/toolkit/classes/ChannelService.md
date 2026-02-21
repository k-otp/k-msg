---
editUrl: false
next: false
prev: false
title: "ChannelService"
---

Defined in: packages/channel/src/toolkit/services/channel.service.ts:17

## Constructors

### Constructor

> **new ChannelService**(): `ChannelService`

#### Returns

`ChannelService`

## Methods

### addSenderNumber()

> **addSenderNumber**(`channelId`, `phoneNumber`, `name?`): `Promise`\<`ServiceSenderNumber`\>

Defined in: packages/channel/src/toolkit/services/channel.service.ts:79

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

Defined in: packages/channel/src/toolkit/services/channel.service.ts:21

#### Parameters

##### channel

`Omit`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>

***

### deleteChannel()

> **deleteChannel**(`channelId`): `Promise`\<`void`\>

Defined in: packages/channel/src/toolkit/services/channel.service.ts:68

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<`void`\>

***

### getChannel()

> **getChannel**(`channelId`): `Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/) \| `null`\>

Defined in: packages/channel/src/toolkit/services/channel.service.ts:35

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/) \| `null`\>

***

### getSenderNumbers()

> **getSenderNumbers**(`channelId?`): `Promise`\<`ServiceSenderNumber`[]\>

Defined in: packages/channel/src/toolkit/services/channel.service.ts:127

#### Parameters

##### channelId?

`string`

#### Returns

`Promise`\<`ServiceSenderNumber`[]\>

***

### listChannels()

> **listChannels**(`providerId?`): `Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)[]\>

Defined in: packages/channel/src/toolkit/services/channel.service.ts:39

#### Parameters

##### providerId?

`string`

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)[]\>

***

### updateChannel()

> **updateChannel**(`channelId`, `updates`): `Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>

Defined in: packages/channel/src/toolkit/services/channel.service.ts:49

#### Parameters

##### channelId

`string`

##### updates

`Partial`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>

#### Returns

`Promise`\<[`ChannelConfig`](/api/channel/src/toolkit/interfaces/channelconfig/)\>

***

### verifySenderNumber()

> **verifySenderNumber**(`phoneNumber`): `Promise`\<[`ChannelVerificationResult`](/api/channel/src/toolkit/interfaces/channelverificationresult/)\>

Defined in: packages/channel/src/toolkit/services/channel.service.ts:100

#### Parameters

##### phoneNumber

`string`

#### Returns

`Promise`\<[`ChannelVerificationResult`](/api/channel/src/toolkit/interfaces/channelverificationresult/)\>
