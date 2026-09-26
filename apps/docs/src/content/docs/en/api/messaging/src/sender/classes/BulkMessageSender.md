---
editUrl: false
next: false
prev: false
title: "BulkMessageSender"
---

Defined in: [packages/messaging/src/sender/bulk.sender.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L22)

## Constructors

### Constructor

> **new BulkMessageSender**(`kmsg`): `BulkMessageSender`

Defined in: [packages/messaging/src/sender/bulk.sender.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L26)

#### Parameters

##### kmsg

[`KMsg`](/en/api/k-msg/src/classes/kmsg/)

#### Returns

`BulkMessageSender`

## Methods

### cancelBulkJob()

> **cancelBulkJob**(`requestId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/sender/bulk.sender.ts:373](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L373)

#### Parameters

##### requestId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### cleanup()

> **cleanup**(): `void`

Defined in: [packages/messaging/src/sender/bulk.sender.ts:439](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L439)

#### Returns

`void`

***

### getBulkStatus()

> **getBulkStatus**(`requestId`): `Promise`\<[`BulkMessageResult`](/en/api/messaging/src/interfaces/bulkmessageresult/) \| `null`\>

Defined in: [packages/messaging/src/sender/bulk.sender.ts:368](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L368)

#### Parameters

##### requestId

`string`

#### Returns

`Promise`\<[`BulkMessageResult`](/en/api/messaging/src/interfaces/bulkmessageresult/) \| `null`\>

***

### retryFailedBatch()

> **retryFailedBatch**(`requestId`, `batchId`): `Promise`\<[`BulkBatchResult`](/en/api/messaging/src/interfaces/bulkbatchresult/) \| `null`\>

Defined in: [packages/messaging/src/sender/bulk.sender.ts:392](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L392)

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

Defined in: [packages/messaging/src/sender/bulk.sender.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sender/bulk.sender.ts#L30)

#### Parameters

##### request

[`BulkMessageRequest`](/en/api/messaging/src/interfaces/bulkmessagerequest/)

#### Returns

`Promise`\<[`BulkMessageResult`](/en/api/messaging/src/interfaces/bulkmessageresult/)\>
