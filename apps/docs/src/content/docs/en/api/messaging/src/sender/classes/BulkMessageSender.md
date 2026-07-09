---
editUrl: false
next: false
prev: false
title: "BulkMessageSender"
---

Defined in: [packages/messaging/src/sender/bulk.sender.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L21)

## Constructors

### Constructor

> **new BulkMessageSender**(`kmsg`): `BulkMessageSender`

Defined in: [packages/messaging/src/sender/bulk.sender.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L25)

#### Parameters

##### kmsg

[`KMsg`](/en/api/k-msg/src/classes/kmsg/)

#### Returns

`BulkMessageSender`

## Methods

### cancelBulkJob()

> **cancelBulkJob**(`requestId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/sender/bulk.sender.ts:364](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L364)

#### Parameters

##### requestId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### cleanup()

> **cleanup**(): `void`

Defined in: [packages/messaging/src/sender/bulk.sender.ts:430](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L430)

#### Returns

`void`

***

### getBulkStatus()

> **getBulkStatus**(`requestId`): `Promise`\<[`BulkMessageResult`](/en/api/messaging/src/interfaces/bulkmessageresult/) \| `null`\>

Defined in: [packages/messaging/src/sender/bulk.sender.ts:359](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L359)

#### Parameters

##### requestId

`string`

#### Returns

`Promise`\<[`BulkMessageResult`](/en/api/messaging/src/interfaces/bulkmessageresult/) \| `null`\>

***

### retryFailedBatch()

> **retryFailedBatch**(`requestId`, `batchId`): `Promise`\<[`BulkBatchResult`](/en/api/messaging/src/interfaces/bulkbatchresult/) \| `null`\>

Defined in: [packages/messaging/src/sender/bulk.sender.ts:383](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L383)

#### Parameters

##### requestId

`string`

##### batchId

`string`

#### Returns

`Promise`\<[`BulkBatchResult`](/en/api/messaging/src/interfaces/bulkbatchresult/) \| `null`\>

***

### sendBulk()

> **sendBulk**(`request`): `Promise`\<[`BulkMessageResult`](/en/api/messaging/src/interfaces/bulkmessageresult/)\>

Defined in: [packages/messaging/src/sender/bulk.sender.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L29)

#### Parameters

##### request

[`BulkMessageRequest`](/en/api/messaging/src/interfaces/bulkmessagerequest/)

#### Returns

`Promise`\<[`BulkMessageResult`](/en/api/messaging/src/interfaces/bulkmessageresult/)\>
