---
editUrl: false
next: false
prev: false
title: "Logger"
---

Defined in: [packages/core/src/logger.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L115)

## Constructors

### Constructor

> **new Logger**(`context?`, `config?`): `Logger`

Defined in: [packages/core/src/logger.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L119)

#### Parameters

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/) = `{}`

##### config?

`Partial`\<[`LoggerConfig`](/api/core/src/interfaces/loggerconfig/)\> = `{}`

#### Returns

`Logger`

## Methods

### child()

> **child**(`context`): `Logger`

Defined in: [packages/core/src/logger.ts:256](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L256)

#### Parameters

##### context

[`LogContext`](/api/core/src/interfaces/logcontext/)

#### Returns

`Logger`

***

### debug()

> **debug**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:218](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L218)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/) = `{}`

#### Returns

`void`

***

### error()

> **error**(`message`, `context?`, `error?`): `void`

Defined in: [packages/core/src/logger.ts:246](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L246)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`

***

### info()

> **info**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:227](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L227)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/) = `{}`

#### Returns

`void`

***

### measure()

> **measure**\<`T`\>(`operation`, `fn`, `context?`): `Promise`\<`T`\>

Defined in: [packages/core/src/logger.ts:268](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L268)

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

`string`

##### fn

() => `Promise`\<`T`\>

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/) = `{}`

#### Returns

`Promise`\<`T`\>

***

### time()

> **time**(`label`): () => `void`

Defined in: [packages/core/src/logger.ts:260](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L260)

#### Parameters

##### label

`string`

#### Returns

> (): `void`

##### Returns

`void`

***

### warn()

> **warn**(`message`, `context?`, `error?`): `void`

Defined in: [packages/core/src/logger.ts:236](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L236)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`
