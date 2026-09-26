---
editUrl: false
next: false
prev: false
title: "KMsgHooks"
---

Defined in: [packages/messaging/src/hooks.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L43)

## Properties

### onBeforeSend?

> `optional` **onBeforeSend?**: (`context`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L48)

Runs before the provider is called. Throwing aborts the send and rejects
the call.

#### Parameters

##### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onError?

> `optional` **onError?**: (`context`, `error`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L53)

#### Parameters

##### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/)

##### error

[`KMsgError`](/en/api/core/src/classes/kmsgerror/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onFinal?

> `optional` **onFinal?**: (`context`, `state`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L63)

#### Parameters

##### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/)

##### state

[`SendHookFinalState`](/en/api/messaging/src/interfaces/sendhookfinalstate/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onHookError?

> `optional` **onHookError?**: (`error`, `info`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L72)

Receives errors thrown by the observer hooks (every hook except
onBeforeSend). Those errors never change the send result. Without this
hook, or when it throws too, they are written to `console.error`.

#### Parameters

##### error

`unknown`

##### info

[`KMsgHookErrorContext`](/en/api/messaging/src/interfaces/kmsghookerrorcontext/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onQueued?

> `optional` **onQueued?**: (`context`, `result`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L54)

#### Parameters

##### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/)

##### result

[`SendResult`](/en/api/core/src/interfaces/sendresult/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onRetryScheduled?

> `optional` **onRetryScheduled?**: (`context`, `error`, `metadata`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L55)

#### Parameters

##### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/) & [`RetryScheduledHookContext`](/en/api/messaging/src/interfaces/retryscheduledhookcontext/)

##### error

[`KMsgError`](/en/api/core/src/classes/kmsgerror/)

##### metadata

###### reason

`string`

###### retryAfterMs?

`number`

#### Returns

`void` \| `Promise`\<`void`\>

***

### onSuccess?

> `optional` **onSuccess?**: (`context`, `result`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L49)

#### Parameters

##### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/)

##### result

[`SendResult`](/en/api/core/src/interfaces/sendresult/)

#### Returns

`void` \| `Promise`\<`void`\>
