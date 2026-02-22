---
editUrl: false
next: false
prev: false
title: "KMsgHooks"
---

Defined in: [packages/messaging/src/hooks.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L26)

## Properties

### onBeforeSend()?

> `optional` **onBeforeSend**: (`context`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L27)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onError()?

> `optional` **onError**: (`context`, `error`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L32)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onFinal()?

> `optional` **onFinal**: (`context`, `state`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L42)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

##### state

[`SendHookFinalState`](/api/messaging/src/interfaces/sendhookfinalstate/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onQueued()?

> `optional` **onQueued**: (`context`, `result`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L33)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

##### result

[`SendResult`](/api/core/src/interfaces/sendresult/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onRetryScheduled()?

> `optional` **onRetryScheduled**: (`context`, `error`, `metadata`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L34)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/) & [`RetryScheduledHookContext`](/api/messaging/src/interfaces/retryscheduledhookcontext/)

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

##### metadata

###### reason

`string`

###### retryAfterMs?

`number`

#### Returns

`void` \| `Promise`\<`void`\>

***

### onSuccess()?

> `optional` **onSuccess**: (`context`, `result`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L28)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

##### result

[`SendResult`](/api/core/src/interfaces/sendresult/)

#### Returns

`void` \| `Promise`\<`void`\>
