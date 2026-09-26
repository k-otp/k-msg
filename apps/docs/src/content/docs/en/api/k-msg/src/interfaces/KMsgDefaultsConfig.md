---
editUrl: false
next: false
prev: false
title: "KMsgDefaultsConfig"
---

Defined in: [packages/messaging/src/k-msg.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L103)

Configuration for default values applied to outgoing messages.

These defaults are merged with message-specific options during normalization,
allowing you to reduce boilerplate for commonly repeated fields.

## Properties

### kakao?

> `optional` **kakao?**: `object`

Defined in: [packages/messaging/src/k-msg.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L118)

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

Defined in: [packages/messaging/src/k-msg.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L128)

Naver Talk (NSA) defaults.

#### talkId?

> `optional` **talkId?**: `string`

Default Naver Talk ID.

***

### rcs?

> `optional` **rcs?**: `object`

Defined in: [packages/messaging/src/k-msg.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L136)

RCS defaults.

#### brandId?

> `optional` **brandId?**: `string`

Default RCS brand ID.

***

### sms?

> `optional` **sms?**: `object`

Defined in: [packages/messaging/src/k-msg.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L107)

SMS/LMS-specific defaults.

#### autoLmsBytes?

> `optional` **autoLmsBytes?**: `number`

If type is omitted (SMS default input), upgrade to LMS when estimated bytes exceed this value.

##### Default

```ts
90
```
