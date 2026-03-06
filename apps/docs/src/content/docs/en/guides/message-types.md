---
title: "Message Type Guide"
description: "Choose between SMS, LMS, AlimTalk, FriendTalk, and other supported message types."
---

Each message type solves a different business problem. The right choice depends on urgency, deliverability, content richness, and whether you need Kakao-native UX.

## Quick comparison

| Type | Best for | Strengths | Tradeoffs |
| --- | --- | --- | --- |
| SMS | OTP, urgent alerts, universal reach | Highest reach, no template registration required | Limited formatting and length |
| LMS | Longer operational notices | More room for detail, optional subject | Higher cost than SMS |
| AlimTalk | Transactional Kakao notifications | High open rate, structured variables, lower cost than SMS in many flows | Kakao template setup required |
| FriendTalk | Promotional Kakao messages | Better visual/marketing experience | Requires Kakao channel relationship |
| RCS and others | Specialized provider-dependent flows | Rich messaging where supported | Availability depends on provider/runtime setup |

## When to choose SMS

Use SMS when:

- every phone number must be reachable
- the message is short and urgent
- pre-approved Kakao templates would slow you down

```ts
await kmsg.send({
  to: "01012345678",
  text: "Your verification code is 123456.",
});
```

## When to choose LMS

Use LMS when:

- the message exceeds SMS length
- you need a subject line
- the user needs more operational detail in one message

```ts
await kmsg.send({
  type: "LMS",
  to: "01012345678",
  subject: "[Notice] Planned maintenance",
  text: "Maintenance is scheduled from 02:00 to 04:00 KST. Some services may be unavailable.",
});
```

## When to choose AlimTalk

Use AlimTalk when:

- the message is transactional
- Kakao reach is acceptable for your audience
- a pre-approved template is operationally worth it

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "ORDER_CONFIRMED",
  variables: {
    orderNo: "20260307-001",
    customerName: "Jane",
  },
});
```

## When to choose FriendTalk

Use FriendTalk when:

- the message is promotional or engagement-oriented
- button-rich Kakao UX matters
- your audience already has a Kakao channel relationship

## Practical selection rules

- Start with SMS for OTP and high-risk delivery requirements.
- Start with AlimTalk for transactional commerce notifications.
- Use FriendTalk for marketing only after consent and channel relationship rules are satisfied.
- Keep LMS as the fallback when SMS is too short or you need more context.

## Fallback strategy

For important transactional Kakao flows, consider an SMS or LMS fallback when Kakao delivery is not enough for the business SLA.

## Next steps

- [Provider Selection](/en/guides/provider-selection/) to check which provider best supports your chosen mix
- [OTP Verification](/en/guides/use-cases/otp-verification/) for SMS-first authentication
- [Order Notifications](/en/guides/use-cases/order-notification/) for AlimTalk-first commerce flows
