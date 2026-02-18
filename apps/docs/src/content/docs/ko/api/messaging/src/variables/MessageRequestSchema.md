---
editUrl: false
next: false
prev: false
title: "MessageRequestSchema"
---

> `const` **MessageRequestSchema**: `ZodObject`\<\{ `options`: `ZodOptional`\<`ZodObject`\<\{ `deduplication`: `ZodOptional`\<`ZodObject`\<\{ `enabled`: `ZodBoolean`; `window`: `ZodNumber`; \}, `$strip`\>\>; `failover`: `ZodOptional`\<`ZodObject`\<\{ `enabled`: `ZodBoolean`; `fallbackChannel`: `ZodOptional`\<`ZodEnum`\<\{ `lms`: ...; `sms`: ...; \}\>\>; `fallbackContent`: `ZodOptional`\<`ZodString`\>; `fallbackTitle`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>\>; `priority`: `ZodDefault`\<`ZodOptional`\<`ZodEnum`\<\{ `high`: `"high"`; `low`: `"low"`; `normal`: `"normal"`; \}\>\>\>; `tracking`: `ZodOptional`\<`ZodObject`\<\{ `enabled`: `ZodBoolean`; `webhookUrl`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>\>; `ttl`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>\>; `recipients`: `ZodArray`\<`ZodObject`\<\{ `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `phoneNumber`: `ZodString`; `variables`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnion`\<readonly \[`ZodString`, `ZodNumber`, `ZodDate`\]\>\>\>; \}, `$strip`\>\>; `scheduling`: `ZodOptional`\<`ZodObject`\<\{ `retryCount`: `ZodDefault`\<`ZodOptional`\<`ZodNumber`\>\>; `scheduledAt`: `ZodDate`; `timezone`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>\>; `templateId`: `ZodString`; `variables`: `ZodRecord`\<`ZodString`, `ZodUnion`\<readonly \[`ZodString`, `ZodNumber`, `ZodDate`\]\>\>; \}, `$strip`\>

Defined in: [packages/messaging/src/types/message.types.ts:261](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L261)
