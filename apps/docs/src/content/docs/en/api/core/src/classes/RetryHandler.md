---
editUrl: false
next: false
prev: false
title: "RetryHandler"
---

Defined in: [packages/core/src/resilience/retry-handler.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/retry-handler.ts#L20)

Exponential backoff retry mechanism

## Constructors

### Constructor

> **new RetryHandler**(): `RetryHandler`

#### Returns

`RetryHandler`

## Methods

### createRetryableFunction()

> `static` **createRetryableFunction**\<`T`, `R`\>(`func`, `options?`): (...`args`) => `Promise`\<`R`\>

Defined in: [packages/core/src/resilience/retry-handler.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/retry-handler.ts#L69)

#### Type Parameters

##### T

`T` *extends* `any`[]

##### R

`R`

#### Parameters

##### func

(...`args`) => `Promise`\<`R`\>

##### options?

`Partial`\<[`RetryOptions`](/api/core/src/interfaces/retryoptions/)\> = `{}`

#### Returns

> (...`args`): `Promise`\<`R`\>

##### Parameters

###### args

...`T`

##### Returns

`Promise`\<`R`\>

***

### execute()

> `static` **execute**\<`T`\>(`operation`, `options?`): `Promise`\<`T`\>

Defined in: [packages/core/src/resilience/retry-handler.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/retry-handler.ts#L30)

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

() => `Promise`\<`T`\>

##### options?

`Partial`\<[`RetryOptions`](/api/core/src/interfaces/retryoptions/)\> = `{}`

#### Returns

`Promise`\<`T`\>
