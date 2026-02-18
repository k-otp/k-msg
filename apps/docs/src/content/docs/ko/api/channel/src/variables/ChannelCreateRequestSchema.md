---
editUrl: false
next: false
prev: false
title: "ChannelCreateRequestSchema"
---

> `const` **ChannelCreateRequestSchema**: `ZodObject`\<\{ `businessInfo`: `ZodOptional`\<`ZodObject`\<\{ `category`: `ZodString`; `contactEmail`: `ZodString`; `contactPerson`: `ZodString`; `contactPhone`: `ZodString`; `name`: `ZodString`; `registrationNumber`: `ZodString`; \}, `$strip`\>\>; `kakaoInfo`: `ZodOptional`\<`ZodObject`\<\{ `brandName`: `ZodString`; `description`: `ZodOptional`\<`ZodString`\>; `logoUrl`: `ZodOptional`\<`ZodString`\>; `plusFriendId`: `ZodString`; \}, `$strip`\>\>; `name`: `ZodString`; `profileKey`: `ZodString`; `provider`: `ZodString`; `type`: `ZodEnum`\<*typeof* [`ChannelType`](/api/channel/src/enumerations/channeltype/)\>; \}, `$strip`\>

Defined in: [packages/channel/src/types/channel.types.ts:189](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L189)
