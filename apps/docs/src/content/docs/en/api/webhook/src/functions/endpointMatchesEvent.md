---
editUrl: false
next: false
prev: false
title: "endpointMatchesEvent"
---

> **endpointMatchesEvent**(`endpoint`, `event`): `boolean`

Defined in: [packages/webhook/src/runtime/event-matcher.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/event-matcher.ts#L18)

## Parameters

### endpoint

#### active

`boolean` = `...`

#### createdAt

`Date` = `...`

#### description?

`string` = `...`

#### events

[`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[] = `...`

#### filters?

\{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \} = `...`

#### filters.channelId?

`string`[] = `...`

#### filters.providerId?

`string`[] = `...`

#### filters.templateId?

`string`[] = `...`

#### headers?

`Record`\<`string`, `string`\> = `...`

#### id

`string` = `...`

#### lastTriggeredAt?

`Date` = `...`

#### name?

`string` = `...`

#### retryConfig?

\{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \} = `...`

#### retryConfig.backoffMultiplier

`number` = `...`

#### retryConfig.maxRetries

`number` = `...`

#### retryConfig.retryDelayMs

`number` = `...`

#### secret?

`string` = `...`

#### status

`"error"` \| `"active"` \| `"inactive"` \| `"suspended"` = `...`

#### updatedAt

`Date` = `...`

#### url

`string` = `...`

### event

[`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

## Returns

`boolean`
