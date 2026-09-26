---
editUrl: false
next: false
prev: false
title: "Logger"
---

Defined in: [packages/core/src/logger.ts:196](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L196)

## Constructors

### Constructor

> **new Logger**(`context?`, `config?`): `Logger`

Defined in: [packages/core/src/logger.ts:200](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L200)

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

Defined in: [packages/core/src/logger.ts:337](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L337)

#### Parameters

##### context

[`LogContext`](/en/api/core/src/interfaces/logcontext/)

#### Returns

`Logger`

***

### debug()

> **debug**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:299](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L299)

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

Defined in: [packages/core/src/logger.ts:327](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L327)

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

Defined in: [packages/core/src/logger.ts:308](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L308)

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

Defined in: [packages/core/src/logger.ts:349](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L349)

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

Defined in: [packages/core/src/logger.ts:341](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L341)

#### Parameters

##### label

`string`

#### Returns

() => `void`

***

### warn()

> **warn**(`message`, `context?`, `error?`): `void`

Defined in: [packages/core/src/logger.ts:317](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L317)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`
