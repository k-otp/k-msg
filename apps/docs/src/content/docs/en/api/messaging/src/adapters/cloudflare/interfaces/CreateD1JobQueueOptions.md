---
editUrl: false
next: false
prev: false
title: "CreateD1JobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:168](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L168)

## Properties

### indexNames?

> `optional` **indexNames?**: `Partial`\<[`JobQueueIndexNames`](/en/api/k-msg/src/adapters/cloudflare/interfaces/jobqueueindexnames/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L170)

***

### initializeSchema?

> `optional` **initializeSchema?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:176](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L176)

Whether the queue creates its table and indexes on first use. Set it to
`false` when migrations create the schema.

#### Default

```ts
true
```

***

### tableName?

> `optional` **tableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:169](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L169)
