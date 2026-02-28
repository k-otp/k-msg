---
editUrl: false
next: false
prev: false
title: "RecipientResultSchema"
---

> `const` **RecipientResultSchema**: `ZodMiniObject`\<\{ `error`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `code`: `ZodMiniString`\<`string`\>; `details`: `ZodMiniOptional`\<`ZodMiniRecord`\<`ZodMiniString`\<`string`\>, `ZodMiniAny`\>\>; `message`: `ZodMiniString`\<`string`\>; \}, `$strip`\>\>; `messageId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `metadata`: `ZodMiniOptional`\<`ZodMiniRecord`\<`ZodMiniString`\<`string`\>, `ZodMiniAny`\>\>; `phoneNumber`: `ZodMiniString`\<`string`\>; `status`: `ZodMiniEnum`\<*typeof* [`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)\>; \}, `$strip`\>

Defined in: [packages/messaging/src/types/message.schema.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.schema.ts#L65)
