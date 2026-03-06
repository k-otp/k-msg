---
title: "Order Notifications"
description: "Use AlimTalk-first order updates with optional SMS fallback."
---

Order notifications are usually a strong fit for AlimTalk. They are transactional, repeatable, and benefit from structured template variables.

## Typical notification stages

- order received
- payment confirmed
- shipment started
- delivery completed

## Why AlimTalk is a strong default

- high open rate for transactional commerce updates
- lower operational noise than sending long SMS for every status change
- template variables make order-specific content predictable

## Basic AlimTalk example

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "ORDER_CONFIRMED",
  variables: {
    orderNo: "20260307-001",
    customerName: "Jane",
    amount: "49,000",
  },
});
```

## Suggested architecture

- primary channel: AlimTalk
- fallback channel: SMS or LMS for critical failures
- data source: order status events from your commerce backend

## Implementation checklist

- register and approve templates before rollout
- keep variable keys stable across template and code
- separate notification templates by lifecycle stage
- decide which stages require fallback and which do not

## When SMS fallback makes sense

Add fallback when:

- the notification is critical for customer support volume
- the order state is time-sensitive
- your business cannot tolerate missed Kakao delivery

## Next steps

- [Provider Selection](/en/guides/provider-selection/) if you are choosing a Kakao-friendly provider
- [Message Type Guide](/en/guides/message-types/) for channel selection tradeoffs
