---
editUrl: false
next: false
prev: false
title: "MessageVariables"
---

> **MessageVariables** = `Record`\<`string`, `string` \| `number` \| `boolean` \| `Date` \| `null` \| `undefined`\>

Defined in: [packages/core/src/types/message.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L63)

Variables for template interpolation.
Values are substituted into #{variableName} placeholders in templates.

## Example

```ts
{ name: "John", code: "123456" }
```
