---
editUrl: false
next: false
prev: false
title: "Logger"
---

Defined in: [packages/core/src/logger.ts:234](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L234)

## Constructors

### Constructor

> **new Logger**(`context?`, `config?`): `Logger`

Defined in: [packages/core/src/logger.ts:238](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L238)

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

Defined in: [packages/core/src/logger.ts:375](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L375)

#### Parameters

##### context

[`LogContext`](/en/api/core/src/interfaces/logcontext/)

#### Returns

`Logger`

***

### debug()

> **debug**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:337](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L337)

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

Defined in: [packages/core/src/logger.ts:365](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L365)

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

Defined in: [packages/core/src/logger.ts:346](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L346)

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

Defined in: [packages/core/src/logger.ts:387](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L387)

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

Defined in: [packages/core/src/logger.ts:379](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L379)

#### Parameters

##### label

`string`

#### Returns

() => `void`

***

### warn()

> **warn**(`message`, `context?`, `error?`): `void`

Defined in: [packages/core/src/logger.ts:355](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L355)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`
