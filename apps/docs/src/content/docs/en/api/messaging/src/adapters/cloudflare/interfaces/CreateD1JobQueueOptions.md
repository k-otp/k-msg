---
editUrl: false
next: false
prev: false
title: "CreateD1JobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:166](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L166)

## Properties

### initializeSchema?

> `optional` **initializeSchema?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:173](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L173)

Whether the queue creates its table and indexes on first use. Set it to
`false` when migrations create the schema.

#### Default

```ts
true
```

***

### tableName?

> `optional` **tableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L167)
