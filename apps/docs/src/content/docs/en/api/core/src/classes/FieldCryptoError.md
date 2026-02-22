---
editUrl: false
next: false
prev: false
title: "FieldCryptoError"
---

Defined in: [packages/core/src/crypto/errors.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/errors.ts#L32)

## Extends

- [`KMsgError`](/api/core/src/classes/kmsgerror/)

## Constructors

### Constructor

> **new FieldCryptoError**(`kind`, `message`, `details?`, `metadata?`): `FieldCryptoError`

Defined in: [packages/core/src/crypto/errors.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/errors.ts#L38)

#### Parameters

##### kind

[`FieldCryptoErrorKind`](/api/core/src/type-aliases/fieldcryptoerrorkind/)

##### message

`string`

##### details?

`Record`\<`string`, `unknown`\>

##### metadata?

[`FieldCryptoErrorMetadata`](/api/core/src/interfaces/fieldcryptoerrormetadata/) = `{}`

#### Returns

`FieldCryptoError`

#### Overrides

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`constructor`](/api/core/src/classes/kmsgerror/#constructor)

## Properties

### attempt?

> `readonly` `optional` **attempt**: `number`

Defined in: [packages/core/src/errors.ts:137](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L137)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`attempt`](/api/core/src/classes/kmsgerror/#attempt)

***

### cause?

> `optional` **cause**: `unknown`

Defined in: node\_modules/.bun/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26

The cause of the error.

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`cause`](/api/core/src/classes/kmsgerror/#cause)

***

### causeChain?

> `readonly` `optional` **causeChain**: `unknown`[]

Defined in: [packages/core/src/errors.ts:138](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L138)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`causeChain`](/api/core/src/classes/kmsgerror/#causechain)

***

### code

> `readonly` **code**: [`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)

Defined in: [packages/core/src/errors.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L130)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`code`](/api/core/src/classes/kmsgerror/#code)

***

### details?

> `readonly` `optional` **details**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/errors.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L131)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`details`](/api/core/src/classes/kmsgerror/#details)

***

### failMode?

> `readonly` `optional` **failMode**: [`FieldCryptoFailMode`](/api/core/src/type-aliases/fieldcryptofailmode/)

Defined in: [packages/core/src/crypto/errors.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/errors.ts#L35)

***

### fieldPath?

> `readonly` `optional` **fieldPath**: `string`

Defined in: [packages/core/src/crypto/errors.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/errors.ts#L34)

***

### httpStatus?

> `readonly` `optional` **httpStatus**: `number`

Defined in: [packages/core/src/errors.ts:134](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L134)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`httpStatus`](/api/core/src/classes/kmsgerror/#httpstatus)

***

### kind

> `readonly` **kind**: [`FieldCryptoErrorKind`](/api/core/src/type-aliases/fieldcryptoerrorkind/)

Defined in: [packages/core/src/crypto/errors.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/errors.ts#L33)

***

### message

> **message**: `string`

Defined in: node\_modules/.bun/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`message`](/api/core/src/classes/kmsgerror/#message)

***

### name

> **name**: `string`

Defined in: node\_modules/.bun/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`name`](/api/core/src/classes/kmsgerror/#name)

***

### openFallback?

> `readonly` `optional` **openFallback**: [`FieldCryptoOpenFallback`](/api/core/src/type-aliases/fieldcryptoopenfallback/)

Defined in: [packages/core/src/crypto/errors.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/errors.ts#L36)

***

### providerErrorCode?

> `readonly` `optional` **providerErrorCode**: `string`

Defined in: [packages/core/src/errors.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L132)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`providerErrorCode`](/api/core/src/classes/kmsgerror/#providererrorcode)

***

### providerErrorText?

> `readonly` `optional` **providerErrorText**: `string`

Defined in: [packages/core/src/errors.ts:133](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L133)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`providerErrorText`](/api/core/src/classes/kmsgerror/#providererrortext)

***

### requestId?

> `readonly` `optional` **requestId**: `string`

Defined in: [packages/core/src/errors.ts:135](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L135)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`requestId`](/api/core/src/classes/kmsgerror/#requestid)

***

### retryAfterMs?

> `readonly` `optional` **retryAfterMs**: `number`

Defined in: [packages/core/src/errors.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L136)

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`retryAfterMs`](/api/core/src/classes/kmsgerror/#retryafterms)

***

### stack?

> `optional` **stack**: `string`

Defined in: node\_modules/.bun/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`stack`](/api/core/src/classes/kmsgerror/#stack)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

Defined in: node\_modules/.bun/@types+node@22.19.11/node\_modules/@types/node/globals.d.ts:68

The `Error.stackTraceLimit` property specifies the number of stack frames
collected by a stack trace (whether generated by `new Error().stack` or
`Error.captureStackTrace(obj)`).

The default value is `10` but may be set to any valid JavaScript number. Changes
will affect any stack trace captured _after_ the value has been changed.

If set to a non-number value, or set to a negative number, stack traces will
not capture any frames.

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`stackTraceLimit`](/api/core/src/classes/kmsgerror/#stacktracelimit)

## Methods

### toJSON()

> **toJSON**(): `object`

Defined in: [packages/core/src/crypto/errors.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/errors.ts#L53)

#### Returns

`object`

##### attempt

> **attempt**: `number` \| `undefined`

##### causeChain

> **causeChain**: `unknown`[] \| `undefined`

##### code

> **code**: [`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)

##### details

> **details**: `Record`\<`string`, `unknown`\> \| `undefined`

##### failMode

> **failMode**: [`FieldCryptoFailMode`](/api/core/src/type-aliases/fieldcryptofailmode/) \| `undefined`

##### fieldPath

> **fieldPath**: `string` \| `undefined`

##### httpStatus

> **httpStatus**: `number` \| `undefined`

##### kind

> **kind**: [`FieldCryptoErrorKind`](/api/core/src/type-aliases/fieldcryptoerrorkind/)

##### message

> **message**: `string`

##### name

> **name**: `string`

##### openFallback

> **openFallback**: [`FieldCryptoOpenFallback`](/api/core/src/type-aliases/fieldcryptoopenfallback/) \| `undefined`

##### providerErrorCode

> **providerErrorCode**: `string` \| `undefined`

##### providerErrorText

> **providerErrorText**: `string` \| `undefined`

##### requestId

> **requestId**: `string` \| `undefined`

##### retryAfterMs

> **retryAfterMs**: `number` \| `undefined`

#### Overrides

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`toJSON`](/api/core/src/classes/kmsgerror/#tojson)

***

### captureStackTrace()

#### Call Signature

> `static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Defined in: node\_modules/.bun/@types+node@22.19.11/node\_modules/@types/node/globals.d.ts:52

Creates a `.stack` property on `targetObject`, which when accessed returns
a string representing the location in the code at which
`Error.captureStackTrace()` was called.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // Similar to `new Error().stack`
```

The first line of the trace will be prefixed with
`${myObject.name}: ${myObject.message}`.

The optional `constructorOpt` argument accepts a function. If given, all frames
above `constructorOpt`, including `constructorOpt`, will be omitted from the
generated stack trace.

The `constructorOpt` argument is useful for hiding implementation
details of error generation from the user. For instance:

```js
function a() {
  b();
}

function b() {
  c();
}

function c() {
  // Create an error without stack trace to avoid calculating the stack trace twice.
  const { stackTraceLimit } = Error;
  Error.stackTraceLimit = 0;
  const error = new Error();
  Error.stackTraceLimit = stackTraceLimit;

  // Capture the stack trace above function b
  Error.captureStackTrace(error, b); // Neither function c, nor b is included in the stack trace
  throw error;
}

a();
```

##### Parameters

###### targetObject

`object`

###### constructorOpt?

`Function`

##### Returns

`void`

##### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`captureStackTrace`](/api/core/src/classes/kmsgerror/#capturestacktrace)

#### Call Signature

> `static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Defined in: node\_modules/.bun/bun-types@1.3.9/node\_modules/bun-types/globals.d.ts:1042

Create .stack property on a target object

##### Parameters

###### targetObject

`object`

###### constructorOpt?

`Function`

##### Returns

`void`

##### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`captureStackTrace`](/api/core/src/classes/kmsgerror/#capturestacktrace)

***

### isError()

#### Call Signature

> `static` **isError**(`error`): `error is Error`

Defined in: node\_modules/.bun/typescript@5.9.3/node\_modules/typescript/lib/lib.esnext.error.d.ts:23

Indicates whether the argument provided is a built-in Error instance or not.

##### Parameters

###### error

`unknown`

##### Returns

`error is Error`

##### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`isError`](/api/core/src/classes/kmsgerror/#iserror)

#### Call Signature

> `static` **isError**(`value`): `value is Error`

Defined in: node\_modules/.bun/bun-types@1.3.9/node\_modules/bun-types/globals.d.ts:1037

Check if a value is an instance of Error

##### Parameters

###### value

`unknown`

The value to check

##### Returns

`value is Error`

True if the value is an instance of Error, false otherwise

##### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`isError`](/api/core/src/classes/kmsgerror/#iserror)

***

### prepareStackTrace()

> `static` **prepareStackTrace**(`err`, `stackTraces`): `any`

Defined in: node\_modules/.bun/@types+node@22.19.11/node\_modules/@types/node/globals.d.ts:56

#### Parameters

##### err

`Error`

##### stackTraces

`CallSite`[]

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[`KMsgError`](/api/core/src/classes/kmsgerror/).[`prepareStackTrace`](/api/core/src/classes/kmsgerror/#preparestacktrace)
