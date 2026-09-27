---
editUrl: false
next: false
prev: false
title: "DeliveryStatusChange"
---

Defined in: [packages/messaging/src/delivery-tracking/service.ts:191](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L191)

A status a poll stored for a tracked message.

## Properties

### previousStatus

> **previousStatus**: [`DeliveryStatus`](/en/api/core/src/type-aliases/deliverystatus/)

Defined in: [packages/messaging/src/delivery-tracking/service.ts:198](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L198)

The status the record had before the poll.

***

### record

> **record**: [`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

Defined in: [packages/messaging/src/delivery-tracking/service.ts:196](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L196)

The record as stored after the poll, or as the poll updated it, without
`raw`, if the store cannot return it.
