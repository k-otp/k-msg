---
editUrl: false
next: false
prev: false
title: "MessageResultSchema"
---

> `const` **MessageResultSchema**: `ZodObject`\<\{ `metadata`: `ZodObject`\<\{ `createdAt`: `ZodDate`; `provider`: `ZodString`; `templateId`: `ZodString`; \}, `$strip`\>; `requestId`: `ZodString`; `results`: `ZodArray`\<`ZodObject`\<\{ `error`: `ZodOptional`\<`ZodObject`\<\{ `code`: `ZodString`; `details`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `message`: `ZodString`; \}, `$strip`\>\>; `messageId`: `ZodOptional`\<`ZodString`\>; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `phoneNumber`: `ZodString`; `status`: `ZodEnum`\<*typeof* [`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)\>; \}, `$strip`\>\>; `summary`: `ZodObject`\<\{ `failed`: `ZodNumber`; `queued`: `ZodNumber`; `sent`: `ZodNumber`; `total`: `ZodNumber`; \}, `$strip`\>; \}, `$strip`\>

Defined in: [packages/messaging/src/types/message.types.ts:283](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L283)
