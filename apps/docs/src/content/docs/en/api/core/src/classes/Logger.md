---
editUrl: false
next: false
prev: false
title: "Logger"
---

Defined in: [packages/core/src/logger.ts:38](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L38)

## Constructors

### Constructor

> **new Logger**(`context?`, `config?`): `Logger`

Defined in: [packages/core/src/logger.ts:42](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L42)

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

Defined in: [packages/core/src/logger.ts:177](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L177)

#### Parameters

##### context

[`LogContext`](/api/core/src/interfaces/logcontext/)

#### Returns

`Logger`

***

### debug()

> **debug**(`message`, `context?`): `void`

Defined in: [packages/core/src/logger.ts:139](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L139)

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

Defined in: [packages/core/src/logger.ts:167](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L167)

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

Defined in: [packages/core/src/logger.ts:148](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L148)

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

Defined in: [packages/core/src/logger.ts:189](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L189)

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

Defined in: [packages/core/src/logger.ts:181](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L181)

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

Defined in: [packages/core/src/logger.ts:157](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/logger.ts#L157)

#### Parameters

##### message

`string`

##### context?

[`LogContext`](/api/core/src/interfaces/logcontext/) = `{}`

##### error?

`Error`

#### Returns

`void`
