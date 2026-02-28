---
editUrl: false
next: false
prev: false
title: "ChannelCreateRequestSchema"
---

> `const` **ChannelCreateRequestSchema**: `ZodMiniObject`\<\{ `businessInfo`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `category`: `ZodMiniString`\<`string`\>; `contactEmail`: `ZodMiniEmail`; `contactPerson`: `ZodMiniString`\<`string`\>; `contactPhone`: `ZodMiniString`\<`string`\>; `name`: `ZodMiniString`\<`string`\>; `registrationNumber`: `ZodMiniString`\<`string`\>; \}, `$strip`\>\>; `kakaoInfo`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `brandName`: `ZodMiniString`\<`string`\>; `description`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `logoUrl`: `ZodMiniOptional`\<`ZodMiniURL`\>; `plusFriendId`: `ZodMiniString`\<`string`\>; \}, `$strip`\>\>; `name`: `ZodMiniString`\<`string`\>; `profileKey`: `ZodMiniString`\<`string`\>; `provider`: `ZodMiniString`\<`string`\>; `type`: `ZodMiniEnum`\<*typeof* [`ChannelType`](/api/channel/src/toolkit/enumerations/channeltype/)\>; \}, `$strip`\>

Defined in: [packages/channel/src/types/channel.types.ts:189](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L189)
