---
editUrl: false
next: false
prev: false
title: "WebhookEventSchema"
---

> `const` **WebhookEventSchema**: `ZodObject`\<\{ `data`: `ZodAny`; `id`: `ZodString`; `metadata`: `ZodObject`\<\{ `channelId`: `ZodOptional`\<`ZodString`\>; `correlationId`: `ZodOptional`\<`ZodString`\>; `messageId`: `ZodOptional`\<`ZodString`\>; `organizationId`: `ZodOptional`\<`ZodString`\>; `providerId`: `ZodOptional`\<`ZodString`\>; `retryCount`: `ZodOptional`\<`ZodNumber`\>; `templateId`: `ZodOptional`\<`ZodString`\>; `userId`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>; `timestamp`: `ZodPipe`\<`ZodTransform`\<`unknown`, `unknown`\>, `ZodDate`\>; `type`: `ZodString`; `version`: `ZodString`; \}, `$strip`\>

Defined in: [packages/webhook/src/types/webhook.types.ts:176](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L176)
