---
editUrl: false
next: false
prev: false
title: "Logger"
---

Defined in: [packages/core/src/logger.ts:157](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L157)

## Constructors

### Constructor

> **new Logger**(`context?`, `config?`): `Logger`

Defined in: [packages/core/src/logger.ts:161](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L161)

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

Defined in: [packages/core/src/logger.ts:298](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L298)

#### Parameters

##### context

[`LogContext`](/en/api/core/src/interfaces/logcontext/)

#### Returns

`Logger`

***

### debug()

> **debug**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:260](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L260)

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

Defined in: [packages/core/src/logger.ts:288](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L288)

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

Defined in: [packages/core/src/logger.ts:269](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L269)

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

Defined in: [packages/core/src/logger.ts:310](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L310)

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

Defined in: [packages/core/src/logger.ts:302](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L302)

#### Parameters

##### label

`string`

#### Returns

() => `void`

***

### warn()

> **warn**(`message`, `context?`, `error?`): `void`

Defined in: [packages/core/src/logger.ts:278](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L278)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`
