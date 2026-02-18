---
editUrl: false
next: false
prev: false
title: "RecipientResultSchema"
---

> `const` **RecipientResultSchema**: `ZodObject`\<\{ `error`: `ZodOptional`\<`ZodObject`\<\{ `code`: `ZodString`; `details`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `message`: `ZodString`; \}, `$strip`\>\>; `messageId`: `ZodOptional`\<`ZodString`\>; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `phoneNumber`: `ZodString`; `status`: `ZodEnum`\<*typeof* [`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)\>; \}, `$strip`\>

Defined in: [packages/messaging/src/types/message.types.ts:275](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L275)
