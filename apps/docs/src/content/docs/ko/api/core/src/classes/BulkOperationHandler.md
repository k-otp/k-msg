---
editUrl: false
next: false
prev: false
title: "BulkOperationHandler"
---

Defined in: [packages/core/src/resilience/bulk-operation.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/bulk-operation.ts#L15)

## Constructors

### Constructor

> **new BulkOperationHandler**(): `BulkOperationHandler`

#### Returns

`BulkOperationHandler`

## Methods

### execute()

> `static` **execute**\<`T`, `R`\>(`items`, `operation`, `options?`): `Promise`\<\{ `failed`: `object`[]; `successful`: `object`[]; `summary`: \{ `duration`: `number`; `failed`: `number`; `successful`: `number`; `total`: `number`; \}; \}\>

Defined in: [packages/core/src/resilience/bulk-operation.ts:16](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/bulk-operation.ts#L16)

#### Type Parameters

##### T

`T`

##### R

`R`

#### Parameters

##### items

`T`[]

##### operation

(`item`) => `Promise`\<`R`\>

##### options?

`Partial`\<[`BulkOperationOptions`](/api/core/src/interfaces/bulkoperationoptions/)\> = `{}`

#### Returns

`Promise`\<\{ `failed`: `object`[]; `successful`: `object`[]; `summary`: \{ `duration`: `number`; `failed`: `number`; `successful`: `number`; `total`: `number`; \}; \}\>
