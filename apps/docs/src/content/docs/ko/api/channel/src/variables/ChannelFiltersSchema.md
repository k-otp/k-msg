---
editUrl: false
next: false
prev: false
title: "ChannelFiltersSchema"
---

> `const` **ChannelFiltersSchema**: `ZodObject`\<\{ `createdAfter`: `ZodOptional`\<`ZodDate`\>; `createdBefore`: `ZodOptional`\<`ZodDate`\>; `provider`: `ZodOptional`\<`ZodString`\>; `status`: `ZodOptional`\<`ZodEnum`\<*typeof* [`ChannelStatus`](/api/channel/src/enumerations/channelstatus/)\>\>; `type`: `ZodOptional`\<`ZodEnum`\<*typeof* [`ChannelType`](/api/channel/src/enumerations/channeltype/)\>\>; `verified`: `ZodOptional`\<`ZodBoolean`\>; \}, `$strip`\>

Defined in: [packages/channel/src/types/channel.types.ts:227](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L227)
