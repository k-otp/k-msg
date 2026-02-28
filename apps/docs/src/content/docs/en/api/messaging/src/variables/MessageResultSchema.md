---
editUrl: false
next: false
prev: false
title: "MessageResultSchema"
---

> `const` **MessageResultSchema**: `ZodMiniObject`\<\{ `metadata`: `ZodMiniObject`\<\{ `createdAt`: `ZodMiniDate`\<`Date`\>; `provider`: `ZodMiniString`\<`string`\>; `templateId`: `ZodMiniString`\<`string`\>; \}, `$strip`\>; `requestId`: `ZodMiniString`\<`string`\>; `results`: `ZodMiniArray`\<`ZodMiniObject`\<\{ `error`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `code`: `ZodMiniString`\<`string`\>; `details`: `ZodMiniOptional`\<`ZodMiniRecord`\<`ZodMiniString`\<...\>, `ZodMiniAny`\>\>; `message`: `ZodMiniString`\<`string`\>; \}, `$strip`\>\>; `messageId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `metadata`: `ZodMiniOptional`\<`ZodMiniRecord`\<`ZodMiniString`\<`string`\>, `ZodMiniAny`\>\>; `phoneNumber`: `ZodMiniString`\<`string`\>; `status`: `ZodMiniEnum`\<*typeof* [`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)\>; \}, `$strip`\>\>; `summary`: `ZodMiniObject`\<\{ `failed`: `ZodMiniNumber`\<`number`\>; `queued`: `ZodMiniNumber`\<`number`\>; `sent`: `ZodMiniNumber`\<`number`\>; `total`: `ZodMiniNumber`\<`number`\>; \}, `$strip`\>; \}, `$strip`\>

Defined in: [packages/messaging/src/types/message.schema.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.schema.ts#L73)
