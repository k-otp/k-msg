---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingHooksOptions"
---

Defined in: [packages/messaging/src/delivery-tracking/hooks.ts:5](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/hooks.ts#L5)

## Properties

### onError?

> `optional` **onError?**: (`error`, `context`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/hooks.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/hooks.ts#L17)

Called when a send fails, as the `KMsg` `onError` hook.

#### Parameters

##### error

[`KMsgError`](/en/api/core/src/classes/kmsgerror/)

##### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onFinal?

> `optional` **onFinal?**: (`context`, `state`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/hooks.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/hooks.ts#L24)

#### Parameters

##### context

`unknown`

##### state

`unknown`

#### Returns

`void` \| `Promise`\<`void`\>

***

### onQueued?

> `optional` **onQueued?**: (`context`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/hooks.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/hooks.ts#L18)

#### Parameters

##### context

`unknown`

#### Returns

`void` \| `Promise`\<`void`\>

***

### onRecordError?

> `optional` **onRecordError?**: (`error`, `info`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/hooks.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/hooks.ts#L12)

Called when a message the provider accepted could not be recorded for
tracking, so it will not be polled. The send still succeeds. Without
this option the error is thrown from the hook, and `KMsg` passes it to
`onHookError`, or to `console.error` without one.

#### Parameters

##### error

`unknown`

##### info

###### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/)

###### result

[`SendResult`](/en/api/core/src/interfaces/sendresult/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onRetryScheduled?

> `optional` **onRetryScheduled?**: (`context`, `error`, `metadata`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/hooks.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/hooks.ts#L19)

#### Parameters

##### context

`unknown`

##### error

`unknown`

##### metadata

`unknown`

#### Returns

`void` \| `Promise`\<`void`\>
