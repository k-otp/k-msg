---
editUrl: false
next: false
prev: false
title: "ChannelMetadata"
---

Defined in: [packages/channel/src/types/channel.types.ts:71](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/types/channel.types.ts#L71)

## Properties

### businessInfo?

> `optional` **businessInfo**: `object`

Defined in: [packages/channel/src/types/channel.types.ts:72](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/types/channel.types.ts#L72)

#### category

> **category**: `string`

#### contactEmail

> **contactEmail**: `string`

#### contactPerson

> **contactPerson**: `string`

#### contactPhone

> **contactPhone**: `string`

#### name

> **name**: `string`

#### registrationNumber

> **registrationNumber**: `string`

***

### features

> **features**: `object`

Defined in: [packages/channel/src/types/channel.types.ts:91](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/types/channel.types.ts#L91)

#### maxButtonCount

> **maxButtonCount**: `number`

#### supportsBulkSending

> **supportsBulkSending**: `boolean`

#### supportsButtons

> **supportsButtons**: `boolean`

#### supportsScheduling

> **supportsScheduling**: `boolean`

***

### kakaoInfo?

> `optional` **kakaoInfo**: `object`

Defined in: [packages/channel/src/types/channel.types.ts:80](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/types/channel.types.ts#L80)

#### brandName

> **brandName**: `string`

#### description?

> `optional` **description**: `string`

#### logoUrl?

> `optional` **logoUrl**: `string`

#### plusFriendId

> **plusFriendId**: `string`

***

### limits

> **limits**: `object`

Defined in: [packages/channel/src/types/channel.types.ts:86](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/types/channel.types.ts#L86)

#### dailyMessageLimit

> **dailyMessageLimit**: `number`

#### monthlyMessageLimit

> **monthlyMessageLimit**: `number`

#### rateLimit

> **rateLimit**: `number`
