---
editUrl: false
next: false
prev: false
title: "SenderNumberCreateRequestSchema"
---

> `const` **SenderNumberCreateRequestSchema**: `ZodObject`\<\{ `businessInfo`: `ZodOptional`\<`ZodObject`\<\{ `businessName`: `ZodString`; `businessRegistrationNumber`: `ZodString`; `contactEmail`: `ZodString`; `contactPerson`: `ZodString`; \}, `$strip`\>\>; `category`: `ZodEnum`\<*typeof* [`SenderNumberCategory`](/api/channel/src/enumerations/sendernumbercategory/)\>; `phoneNumber`: `ZodString`; \}, `$strip`\>

Defined in: [packages/channel/src/types/channel.types.ts:214](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/types/channel.types.ts#L214)
