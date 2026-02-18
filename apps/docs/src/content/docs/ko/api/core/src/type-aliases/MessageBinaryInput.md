---
editUrl: false
next: false
prev: false
title: "MessageBinaryInput"
---

> **MessageBinaryInput** = \{ `contentType?`: `string`; `filename?`: `string`; `ref`: `string`; \} \| \{ `bytes`: `Uint8Array`; `contentType?`: `string`; `filename?`: `string`; \} \| \{ `blob`: `Blob`; `contentType?`: `string`; `filename?`: `string`; \}

Defined in: [packages/core/src/types/message.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L34)

## Type Declaration

\{ `contentType?`: `string`; `filename?`: `string`; `ref`: `string`; \}

### contentType?

> `optional` **contentType**: `string`

### filename?

> `optional` **filename**: `string`

### ref

> **ref**: `string`

URL or file path (provider-dependent).

\{ `bytes`: `Uint8Array`; `contentType?`: `string`; `filename?`: `string`; \}

### bytes

> **bytes**: `Uint8Array`

### contentType?

> `optional` **contentType**: `string`

### filename?

> `optional` **filename**: `string`

\{ `blob`: `Blob`; `contentType?`: `string`; `filename?`: `string`; \}

### blob

> **blob**: `Blob`

### contentType?

> `optional` **contentType**: `string`

### filename?

> `optional` **filename**: `string`
