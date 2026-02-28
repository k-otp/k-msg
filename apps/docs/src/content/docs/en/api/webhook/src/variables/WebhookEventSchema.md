---
editUrl: false
next: false
prev: false
title: "WebhookEventSchema"
---

> `const` **WebhookEventSchema**: `ZodMiniObject`\<\{ `data`: `ZodMiniAny`; `id`: `ZodMiniString`\<`string`\>; `metadata`: `ZodMiniObject`\<\{ `channelId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `correlationId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `messageId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `organizationId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `providerId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `retryCount`: `ZodMiniOptional`\<`ZodMiniNumber`\<`number`\>\>; `templateId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `userId`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; \}, `$strip`\>; `timestamp`: `ZodMiniPipe`\<`ZodMiniTransform`\<`unknown`, `unknown`\>, `ZodMiniDate`\<`Date`\>\>; `type`: `ZodMiniString`\<`string`\>; `version`: `ZodMiniString`\<`string`\>; \}, `$strip`\>

Defined in: [packages/webhook/src/types/webhook.types.ts:176](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L176)
