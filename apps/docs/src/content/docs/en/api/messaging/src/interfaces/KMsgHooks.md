---
editUrl: false
next: false
prev: false
title: "KMsgHooks"
---

Defined in: [packages/messaging/src/hooks.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L9)

## Properties

### onBeforeSend()?

> `optional` **onBeforeSend**: (`context`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L10)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onError()?

> `optional` **onError**: (`context`, `error`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L15)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onSuccess()?

> `optional` **onSuccess**: (`context`, `result`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/hooks.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/hooks.ts#L11)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

##### result

[`SendResult`](/api/core/src/interfaces/sendresult/)

#### Returns

`void` \| `Promise`\<`void`\>
