---
editUrl: false
next: false
prev: false
title: "ChannelMetadata"
---

Defined in: [packages/channel/src/types/channel.types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L70)

## Properties

### businessInfo?

> `optional` **businessInfo**: `object`

Defined in: [packages/channel/src/types/channel.types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L71)

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

Defined in: [packages/channel/src/types/channel.types.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L90)

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

Defined in: [packages/channel/src/types/channel.types.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L79)

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

Defined in: [packages/channel/src/types/channel.types.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L85)

#### dailyMessageLimit

> **dailyMessageLimit**: `number`

#### monthlyMessageLimit

> **monthlyMessageLimit**: `number`

#### rateLimit

> **rateLimit**: `number`
