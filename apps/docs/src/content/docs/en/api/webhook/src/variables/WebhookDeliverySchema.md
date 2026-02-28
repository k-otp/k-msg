---
editUrl: false
next: false
prev: false
title: "WebhookDeliverySchema"
---

> `const` **WebhookDeliverySchema**: `ZodMiniObject`\<\{ `attempts`: `ZodMiniArray`\<`ZodMiniObject`\<\{ `attemptNumber`: `ZodMiniNumber`\<`number`\>; `error`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `httpStatus`: `ZodMiniOptional`\<`ZodMiniNumber`\<`number`\>\>; `latencyMs`: `ZodMiniNumber`\<`number`\>; `responseBody`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `responseHeaders`: `ZodMiniOptional`\<`ZodMiniRecord`\<`ZodMiniString`\<`string`\>, `ZodMiniString`\<`string`\>\>\>; `timestamp`: `ZodMiniDate`\<`Date`\>; \}, `$strip`\>\>; `completedAt`: `ZodMiniOptional`\<`ZodMiniDate`\<`Date`\>\>; `createdAt`: `ZodMiniDate`\<`Date`\>; `endpointId`: `ZodMiniString`\<`string`\>; `eventId`: `ZodMiniString`\<`string`\>; `eventType`: `ZodMiniOptional`\<`ZodMiniString`\<`string`\>\>; `headers`: `ZodMiniRecord`\<`ZodMiniString`\<`string`\>, `ZodMiniString`\<`string`\>\>; `httpMethod`: `ZodMiniEnum`\<\{ `PATCH`: `"PATCH"`; `POST`: `"POST"`; `PUT`: `"PUT"`; \}\>; `id`: `ZodMiniString`\<`string`\>; `nextRetryAt`: `ZodMiniOptional`\<`ZodMiniDate`\<`Date`\>\>; `payload`: `ZodMiniString`\<`string`\>; `status`: `ZodMiniEnum`\<\{ `exhausted`: `"exhausted"`; `failed`: `"failed"`; `pending`: `"pending"`; `success`: `"success"`; \}\>; `url`: `ZodMiniURL`; \}, `$strip`\>

Defined in: [packages/webhook/src/types/webhook.types.ts:232](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L232)
