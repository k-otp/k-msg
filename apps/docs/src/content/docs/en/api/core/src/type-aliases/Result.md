---
editUrl: false
next: false
prev: false
title: "Result"
---

> **Result**\<`T`, `E`\> = [`Ok`](/api/core/src/type-aliases/ok/)\<`T`\> \| [`Fail`](/api/core/src/type-aliases/fail/)\<`E`\>

Defined in: [packages/core/src/result.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L47)

A result type that represents either success (Ok) or failure (Fail).
Used throughout k-msg for explicit error handling without exceptions.

## Type Parameters

### T

`T`

The type of the success value

### E

`E` = `Error`

The type of the error (defaults to Error)

## Example

```ts
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return fail("division by zero");
  return ok(a / b);
}

const result = divide(10, 2);
if (result.isSuccess) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```
