---
editUrl: false
next: false
prev: false
title: "KMsgDefaultsConfig"
---

Defined in: [packages/messaging/src/k-msg.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L94)

Configuration for default values applied to outgoing messages.

These defaults are merged with message-specific options during normalization,
allowing you to reduce boilerplate for commonly repeated fields.

## Properties

### kakao?

> `optional` **kakao?**: `object`

Defined in: [packages/messaging/src/k-msg.ts:109](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L109)

Kakao (ALIMTALK/FRIENDTALK) defaults.

#### plusId?

> `optional` **plusId?**: `string`

Default Kakao Plus friend ID.

#### profileId?

> `optional` **profileId?**: `string`

Default Kakao profile ID (pfId) for template-based messages.

***

### naver?

> `optional` **naver?**: `object`

Defined in: [packages/messaging/src/k-msg.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L119)

Naver Talk (NSA) defaults.

#### talkId?

> `optional` **talkId?**: `string`

Default Naver Talk ID.

***

### rcs?

> `optional` **rcs?**: `object`

Defined in: [packages/messaging/src/k-msg.ts:127](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L127)

RCS defaults.

#### brandId?

> `optional` **brandId?**: `string`

Default RCS brand ID.

***

### sms?

> `optional` **sms?**: `object`

Defined in: [packages/messaging/src/k-msg.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L98)

SMS/LMS-specific defaults.

#### autoLmsBytes?

> `optional` **autoLmsBytes?**: `number`

If type is omitted (SMS default input), upgrade to LMS when estimated bytes exceed this value.

##### Default

```ts
90
```
