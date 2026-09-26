---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingTypeStrategy"
---

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L84)

## Properties

### id?

> `optional` **id?**: `DeliveryTrackingIdType`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L86)

***

### json?

> `optional` **json?**: `DeliveryTrackingJsonType`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:97](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L97)

***

### messageId?

> `optional` **messageId?**: `DeliveryTrackingMessageIdType`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L85)

***

### shortText?

> `optional` **shortText?**: `DeliveryTrackingShortTextType`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L87)

***

### timestamp?

> `optional` **timestamp?**: `DeliveryTrackingTimestampType`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:96](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L96)

Type of the time columns. `bigint` stores epoch milliseconds in `BIGINT`
(`INTEGER` on SQLite, which is 64-bit). `integer` is an alias of
`bigint`, kept for compatibility: epoch milliseconds do not fit the
32-bit `INTEGER` of Postgres and MySQL. `date` is `TIMESTAMPTZ` on
Postgres and the same as `bigint` on MySQL and SQLite.

#### Default

```ts
"bigint"
```
