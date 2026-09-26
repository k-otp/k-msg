---
editUrl: false
next: false
prev: false
title: "Logger"
---

Defined in: [packages/core/src/logger.ts:199](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L199)

## Constructors

### Constructor

> **new Logger**(`context?`, `config?`): `Logger`

Defined in: [packages/core/src/logger.ts:203](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L203)

#### Parameters

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

##### config?

`Partial`\<[`LoggerConfig`](/en/api/core/src/interfaces/loggerconfig/)\> = `{}`

#### Returns

`Logger`

## Methods

### child()

> **child**(`context`): `Logger`

Defined in: [packages/core/src/logger.ts:340](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L340)

#### Parameters

##### context

[`LogContext`](/en/api/core/src/interfaces/logcontext/)

#### Returns

`Logger`

***

### debug()

> **debug**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:302](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L302)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

#### Returns

`void`

***

### error()

> **error**(`message`, `context?`, `error?`): `void`

Defined in: [packages/core/src/logger.ts:330](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L330)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`

***

### info()

> **info**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:311](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L311)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

#### Returns

`void`

***

### measure()

> **measure**\<`T`\>(`operation`, `fn`, `context?`): `Promise`\<`T`\>

Defined in: [packages/core/src/logger.ts:352](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L352)

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

`string`

##### fn

() => `Promise`\<`T`\>

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

#### Returns

`Promise`\<`T`\>

***

### time()

> **time**(`label`): () => `void`

Defined in: [packages/core/src/logger.ts:344](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L344)

#### Parameters

##### label

`string`

#### Returns

() => `void`

***

### warn()

> **warn**(`message`, `context?`, `error?`): `void`

Defined in: [packages/core/src/logger.ts:320](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L320)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`
