---
editUrl: false
next: false
prev: false
title: "Result"
---

> **Result**: `object`

Defined in: [packages/core/src/result.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L47)

Result utility functions for chaining and transformation

## Type Declaration

### expect()

> **expect**\<`T`, `E`\>(`result`, `message`): `T`

Return the value on success, or throw with a custom message on failure.
Use this when you want to convert a failed Result to an exception.

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

The Result to expect

##### message

`string`

Custom error message to use if result is fail

#### Returns

`T`

The success value

#### Throws

Error with the provided message (and original error as cause)

#### Example

```ts
const value = Result.expect(result, 'Message send failed');
// throws Error('Message send failed') if result is fail
```

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

### tap()

> **tap**\<`T`, `E`\>(`result`, `fn`): [`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

Execute a side-effect without breaking the chain.
Calls fn with the result (ok or fail) and returns the same result.

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

The Result to tap

##### fn

(`result`) => `void`

Side-effect function called with the result

#### Returns

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

The same Result for chaining

#### Example

```ts
const result = await provider.send(options);
Result.tap(result, r => console.log('Completed:', r));
```

### tapErr()

> **tapErr**\<`T`, `E`\>(`result`, `fn`): [`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

Execute a side-effect on failure only.
Calls fn with the error only if result is fail, returns the same result.

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

The Result to tap

##### fn

(`error`) => `void`

Side-effect function called with the error on failure

#### Returns

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

The same Result for chaining

#### Example

```ts
Result.tapErr(result, error => console.error('Failed:', error.message));
```

### tapOk()

> **tapOk**\<`T`, `E`\>(`result`, `fn`): [`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

Execute a side-effect on success only.
Calls fn with the value only if result is ok, returns the same result.

#### Type Parameters

##### T

`T`

##### E

`E`

#### Parameters

##### result

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

The Result to tap

##### fn

(`value`) => `void`

Side-effect function called with the value on success

#### Returns

[`Result`](/api/core/src/type-aliases/result/)\<`T`, `E`\>

The same Result for chaining

#### Example

```ts
Result.tapOk(result, value => console.log('Success:', value.messageId));
```

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
