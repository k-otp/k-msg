---
editUrl: false
next: false
prev: false
title: "interpolate"
---

> **interpolate**(`text`, `vars`): `string`

Defined in: [packages/template/src/interpolator.ts:8](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/interpolator.ts#L8)

Interpolates variables into a string using the #{key} syntax.

## Parameters

### text

`string`

The string to interpolate

### vars

`Record`\<`string`, `any`\>

A record of key-value pairs to replace

## Returns

`string`

The interpolated string
