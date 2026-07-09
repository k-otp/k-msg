---
editUrl: false
next: false
prev: false
title: "SendingOptionsSchema"
---

> `const` **SendingOptionsSchema**: `ZodMiniObject`\<\{ `deduplication`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `enabled`: `ZodMiniBoolean`\<`boolean`\>; `window`: `ZodMiniNumber`\<`number`\>; \}, `$strip`\>\>; `failover`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `enabled`: `ZodMiniBoolean`\<`boolean`\>; `fallbackChannel`: `ZodMiniOptional`\<`ZodMiniEnum`\<\{ `lms`: `"lms"`; `sms`: `"sms"`; \}\>\>; `fallbackContent`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `fallbackTitle`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; \}, `$strip`\>\>; `priority`: `ZodMiniDefault`\<`ZodMiniOptional`\<`ZodMiniEnum`\<\{ `high`: `"high"`; `low`: `"low"`; `normal`: `"normal"`; \}\>\>\>; `tracking`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `enabled`: `ZodMiniBoolean`\<`boolean`\>; `webhookUrl`: `ZodMiniOptional`\<`ZodMiniURL`\>; \}, `$strip`\>\>; `ttl`: `ZodMiniOptional`\<`ZodMiniNumber`\<`number`\>\>; \}, `$strip`\>

Defined in: [packages/messaging/src/types/message.schema.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.schema.ts#L24)
