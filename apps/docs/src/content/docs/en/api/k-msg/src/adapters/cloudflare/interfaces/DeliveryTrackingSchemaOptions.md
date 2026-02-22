---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingSchemaOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:78](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L78)

## Extended by

- [`CreateDrizzleDeliveryTrackingStoreOptions`](/api/messaging/src/adapters/cloudflare/interfaces/createdrizzledeliverytrackingstoreoptions/)
- [`CreateD1DeliveryTrackingStoreOptions`](/api/messaging/src/adapters/cloudflare/interfaces/created1deliverytrackingstoreoptions/)
- [`BuildDeliveryTrackingSchemaSqlOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/builddeliverytrackingschemasqloptions/)

## Properties

### columnMap?

> `optional` **columnMap**: `Partial`\<[`DeliveryTrackingColumnMap`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L80)

***

### indexNames?

> `optional` **indexNames**: `Partial`\<\{ `due`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L87)

***

### storeRaw?

> `optional` **storeRaw**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L89)

***

### tableName?

> `optional` **tableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L79)

***

### trackingIndexNames?

> `optional` **trackingIndexNames**: `Partial`\<\{ `due`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L88)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L85)

New API: `typeStrategy`.
Legacy alias preserved for compatibility with `trackingTypeStrategy`.

***

### typeStrategy?

> `optional` **typeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L86)
