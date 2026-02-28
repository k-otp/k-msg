---
editUrl: false
next: false
prev: false
title: "RecipientResultSchema"
---

> `const` **RecipientResultSchema**: `ZodObject`\<\{ `error`: `ZodOptional`\<`ZodObject`\<\{ `code`: `ZodString`; `details`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `message`: `ZodString`; \}, `$strip`\>\>; `messageId`: `ZodOptional`\<`ZodString`\>; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `phoneNumber`: `ZodString`; `status`: `ZodEnum`\<*typeof* [`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)\>; \}, `$strip`\>

Defined in: packages/messaging/src/types/message.schema.ts:60
