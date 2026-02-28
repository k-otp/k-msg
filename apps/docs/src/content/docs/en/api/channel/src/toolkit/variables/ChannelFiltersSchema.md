---
editUrl: false
next: false
prev: false
title: "ChannelFiltersSchema"
---

> `const` **ChannelFiltersSchema**: `ZodMiniObject`\<\{ `createdAfter`: `ZodMiniOptional`\<`ZodMiniDate`\<`Date`\>\>; `createdBefore`: `ZodMiniOptional`\<`ZodMiniDate`\<`Date`\>\>; `provider`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `status`: `ZodMiniOptional`\<`ZodMiniEnum`\<*typeof* [`ChannelStatus`](/api/channel/src/toolkit/enumerations/channelstatus/)\>\>; `type`: `ZodMiniOptional`\<`ZodMiniEnum`\<*typeof* [`ChannelType`](/api/channel/src/toolkit/enumerations/channeltype/)\>\>; `verified`: `ZodMiniOptional`\<`ZodMiniBoolean`\<`boolean`\>\>; \}, `$strip`\>

Defined in: [packages/channel/src/types/channel.types.ts:227](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/types/channel.types.ts#L227)
