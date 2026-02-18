---
editUrl: false
next: false
prev: false
title: "WebhookDeliverySchema"
---

> `const` **WebhookDeliverySchema**: `ZodObject`\<\{ `attempts`: `ZodArray`\<`ZodObject`\<\{ `attemptNumber`: `ZodNumber`; `error`: `ZodOptional`\<`ZodString`\>; `httpStatus`: `ZodOptional`\<`ZodNumber`\>; `latencyMs`: `ZodNumber`; `responseBody`: `ZodOptional`\<`ZodString`\>; `responseHeaders`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodString`\>\>; `timestamp`: `ZodDate`; \}, `$strip`\>\>; `completedAt`: `ZodOptional`\<`ZodDate`\>; `createdAt`: `ZodDate`; `endpointId`: `ZodString`; `eventId`: `ZodString`; `eventType`: `ZodOptional`\<`ZodString`\>; `headers`: `ZodRecord`\<`ZodString`, `ZodString`\>; `httpMethod`: `ZodEnum`\<\{ `PATCH`: `"PATCH"`; `POST`: `"POST"`; `PUT`: `"PUT"`; \}\>; `id`: `ZodString`; `nextRetryAt`: `ZodOptional`\<`ZodDate`\>; `payload`: `ZodString`; `status`: `ZodEnum`\<\{ `exhausted`: `"exhausted"`; `failed`: `"failed"`; `pending`: `"pending"`; `success`: `"success"`; \}\>; `url`: `ZodString`; \}, `$strip`\>

Defined in: [packages/webhook/src/types/webhook.types.ts:229](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L229)
