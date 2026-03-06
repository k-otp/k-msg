---
editUrl: false
next: false
prev: false
title: "ChannelMetadata"
---

Defined in: [packages/channel/src/types/channel.types.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L69)

## Properties

### businessInfo?

> `optional` **businessInfo**: `object`

Defined in: [packages/channel/src/types/channel.types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L70)

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

Defined in: [packages/channel/src/types/channel.types.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L89)

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

Defined in: [packages/channel/src/types/channel.types.ts:78](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L78)

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

Defined in: [packages/channel/src/types/channel.types.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L84)

#### dailyMessageLimit

> **dailyMessageLimit**: `number`

#### monthlyMessageLimit

> **monthlyMessageLimit**: `number`

#### rateLimit

> **rateLimit**: `number`
