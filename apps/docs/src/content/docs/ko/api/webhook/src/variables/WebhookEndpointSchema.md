---
editUrl: false
next: false
prev: false
title: "WebhookEndpointSchema"
---

> `const` **WebhookEndpointSchema**: `ZodObject`\<\{ `active`: `ZodBoolean`; `createdAt`: `ZodDate`; `description`: `ZodOptional`\<`ZodString`\>; `events`: `ZodArray`\<`ZodString`\>; `filters`: `ZodOptional`\<`ZodObject`\<\{ `channelId`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `providerId`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `templateId`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; \}, `$strip`\>\>; `headers`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodString`\>\>; `id`: `ZodString`; `lastTriggeredAt`: `ZodOptional`\<`ZodDate`\>; `name`: `ZodOptional`\<`ZodString`\>; `retryConfig`: `ZodOptional`\<`ZodObject`\<\{ `backoffMultiplier`: `ZodNumber`; `maxRetries`: `ZodNumber`; `retryDelayMs`: `ZodNumber`; \}, `$strip`\>\>; `secret`: `ZodOptional`\<`ZodString`\>; `status`: `ZodEnum`\<\{ `active`: `"active"`; `error`: `"error"`; `inactive`: `"inactive"`; `suspended`: `"suspended"`; \}\>; `updatedAt`: `ZodDate`; `url`: `ZodString`; \}, `$strip`\>

Defined in: [packages/webhook/src/types/webhook.types.ts:200](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L200)
