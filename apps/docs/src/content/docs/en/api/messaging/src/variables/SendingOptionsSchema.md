---
editUrl: false
next: false
prev: false
title: "SendingOptionsSchema"
---

> `const` **SendingOptionsSchema**: `ZodObject`\<\{ `deduplication`: `ZodOptional`\<`ZodObject`\<\{ `enabled`: `ZodBoolean`; `window`: `ZodNumber`; \}, `$strip`\>\>; `failover`: `ZodOptional`\<`ZodObject`\<\{ `enabled`: `ZodBoolean`; `fallbackChannel`: `ZodOptional`\<`ZodEnum`\<\{ `lms`: `"lms"`; `sms`: `"sms"`; \}\>\>; `fallbackContent`: `ZodOptional`\<`ZodString`\>; `fallbackTitle`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>\>; `priority`: `ZodDefault`\<`ZodOptional`\<`ZodEnum`\<\{ `high`: `"high"`; `low`: `"low"`; `normal`: `"normal"`; \}\>\>\>; `tracking`: `ZodOptional`\<`ZodObject`\<\{ `enabled`: `ZodBoolean`; `webhookUrl`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>\>; `ttl`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>

Defined in: packages/messaging/src/types/message.schema.ts:21
