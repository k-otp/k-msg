---
editUrl: false
next: false
prev: false
title: "WebhookEndpointSchema"
---

> `const` **WebhookEndpointSchema**: `ZodMiniObject`\<\{ `active`: `ZodMiniBoolean`\<`boolean`\>; `createdAt`: `ZodMiniDate`\<`Date`\>; `description`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `events`: `ZodMiniArray`\<`ZodMiniString`\<`string`\>\>; `filters`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `channelId`: `ZodMiniOptional`\<`ZodMiniArray`\<`ZodMiniString`\<`string`\>\>\>; `providerId`: `ZodMiniOptional`\<`ZodMiniArray`\<`ZodMiniString`\<`string`\>\>\>; `templateId`: `ZodMiniOptional`\<`ZodMiniArray`\<`ZodMiniString`\<`string`\>\>\>; \}, `$strip`\>\>; `headers`: `ZodMiniOptional`\<`ZodMiniRecord`\<`ZodMiniString`\<`string`\>, `ZodMiniString`\<`string`\>\>\>; `id`: `ZodMiniString`\<`string`\>; `lastTriggeredAt`: `ZodMiniOptional`\<`ZodMiniDate`\<`Date`\>\>; `name`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `retryConfig`: `ZodMiniOptional`\<`ZodMiniObject`\<\{ `backoffMultiplier`: `ZodMiniNumber`\<`number`\>; `maxRetries`: `ZodMiniNumber`\<`number`\>; `retryDelayMs`: `ZodMiniNumber`\<`number`\>; \}, `$strip`\>\>; `secret`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `status`: `ZodMiniEnum`\<\{ `active`: `"active"`; `error`: `"error"`; `inactive`: `"inactive"`; `suspended`: `"suspended"`; \}\>; `updatedAt`: `ZodMiniDate`\<`Date`\>; `url`: `ZodMiniURL`; \}, `$strip`\>

Defined in: [packages/webhook/src/types/webhook.types.ts:203](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L203)
