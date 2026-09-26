---
editUrl: false
next: false
prev: false
title: "Logger"
---

Defined in: [packages/core/src/logger.ts:198](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L198)

## Constructors

### Constructor

> **new Logger**(`context?`, `config?`): `Logger`

Defined in: [packages/core/src/logger.ts:202](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L202)

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

Defined in: [packages/core/src/logger.ts:339](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L339)

#### Parameters

##### context

[`LogContext`](/en/api/core/src/interfaces/logcontext/)

#### Returns

`Logger`

***

### debug()

> **debug**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:301](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L301)

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

Defined in: [packages/core/src/logger.ts:329](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L329)

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

Defined in: [packages/core/src/logger.ts:310](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L310)

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

Defined in: [packages/core/src/logger.ts:351](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L351)

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

Defined in: [packages/core/src/logger.ts:343](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L343)

#### Parameters

##### label

`string`

#### Returns

() => `void`

***

### warn()

> **warn**(`message`, `context?`, `error?`): `void`

Defined in: [packages/core/src/logger.ts:319](https://github.com/k-otp/k-msg/blob/main/packages/core/src/logger.ts#L319)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/en/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`
