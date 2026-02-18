---
editUrl: false
next: false
prev: false
title: "Result"
---

> **Result**: `object`

Defined in: [packages/core/src/result.ts:13](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/result.ts#L13)

Result utility functions for chaining and transformation

## Type Declaration

### flatMap()

> **flatMap**\<`T`, `U`, `E`\>(`result`, `fn`): [`Result`](/api/core/src/type-aliases/result/)\<`U`, `E`\>

Chain Result-returning operations

#### Type Parameters

##### T

`T`

##### U

`U`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

##### fn

(`value`) => [`Result`](/api/core/src/type-aliases/result/)\<`U`, `E`\>

#### Returns

[`Result`](/api/core/src/type-aliases/result/)\<`U`, `E`\>

### fromPromise()

> **fromPromise**\<`T`, `E`\>(`promise`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>\>

Convert a Promise to a Result

#### Type Parameters

##### T

`T`

##### E

`E` = `Error`

#### Parameters

##### promise

`Promise`\<`T`\>

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>\>

### isFail()

> **isFail**\<`T`, `E`\>(`result`): `result is Fail<E>`

Check if a Result is Fail

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

#### Returns

`result is Fail<E>`

### isOk()

> **isOk**\<`T`, `E`\>(`result`): `result is Ok<T>`

Check if a Result is Ok

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

#### Returns

`result is Ok<T>`

### map()

> **map**\<`T`, `U`, `E`\>(`result`, `fn`): [`Result`](/api/core/src/type-aliases/result/)\<`U`, `E`\>

Transform the success value of a Result

#### Type Parameters

##### T

`T`

##### U

`U`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

##### fn

(`value`) => `U`

#### Returns

[`Result`](/api/core/src/type-aliases/result/)\<`U`, `E`\>

### mapError()

> **mapError**\<`T`, `E`, `F`\>(`result`, `fn`): [`Result`](/api/core/src/type-aliases/result/)\<`T`, `F`\>

Transform the error of a Result

#### Type Parameters

##### T

`T`

##### E

`E`

##### F

`F`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

##### fn

(`error`) => `F`

#### Returns

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `F`\>

### match()

> **match**\<`T`, `E`, `U`\>(`result`, `handlers`): `U`

Pattern match on a Result

#### Type Parameters

##### T

`T`

##### E

`E`

##### U

`U`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

##### handlers

###### fail

(`error`) => `U`

###### ok

(`value`) => `U`

#### Returns

`U`

### unwrap()

> **unwrap**\<`T`, `E`\>(`result`): `T`

Extract the value or throw the error

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

#### Returns

`T`

### unwrapOr()

> **unwrapOr**\<`T`, `E`\>(`result`, `defaultValue`): `T`

Extract the value or return a default

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

##### defaultValue

`T`

#### Returns

`T`

### unwrapOrElse()

> **unwrapOrElse**\<`T`, `E`\>(`result`, `fn`): `T`

Extract the value or compute a default from the error

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

##### fn

(`error`) => `T`

#### Returns

`T`
