---
editUrl: false
next: false
prev: false
title: "logger"
---

> `const` **logger**: `object`

Defined in: [packages/core/src/logger.ts:240](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L240)

## Type Declaration

### child()

> **child**: (`context`) => [`Logger`](/api/core/src/classes/logger/)

#### Parameters

##### context

[`LogContext`](/api/core/src/interfaces/logcontext/)

#### Returns

[`Logger`](/api/core/src/classes/logger/)

### debug()

> **debug**: (`message`, `context?`) => `void`

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/)

#### Returns

`void`

### error()

> **error**: (`message`, `context?`, `error?`) => `void`

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/)

##### error?

`Error`

#### Returns

`void`

### info()

> **info**: (`message`, `context?`) => `void`

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/)

#### Returns

`void`

### measure()

> **measure**: \<`T`\>(`operation`, `fn`, `context?`) => `Promise`\<`T`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

`string`

##### fn

() => `Promise`\<`T`\>

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/)

#### Returns

`Promise`\<`T`\>

### time()

> **time**: (`label`) => () => `void`

#### Parameters

##### label

`string`

#### Returns

> (): `void`

##### Returns

`void`

### warn()

> **warn**: (`message`, `context?`, `error?`) => `void`

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/)

##### error?

`Error`

#### Returns

`void`
