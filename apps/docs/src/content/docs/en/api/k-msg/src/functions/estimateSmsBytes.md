---
editUrl: false
next: false
prev: false
title: "estimateSmsBytes"
---

> **estimateSmsBytes**(`text`): `number`

Defined in: [packages/messaging/src/sms-bytes.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/sms-bytes.ts#L16)

Estimates the bytes a text takes as an SMS or LMS, counted the way `KMsg`
counts them to choose between the two: one byte for each ASCII character
and two for any other, such as Hangul. `KMsg` sends text over
`defaults.sms.autoLmsBytes` (90 by default) as LMS.

## Parameters

### text

`string`

## Returns

`number`

## Example

```ts
estimateSmsBytes("Hello"); // 5
estimateSmsBytes("안녕하세요"); // 10
```
