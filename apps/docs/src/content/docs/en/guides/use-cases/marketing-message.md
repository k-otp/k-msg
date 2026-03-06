---
title: "Marketing Messages"
description: "Choose between FriendTalk and SMS for consent-based campaigns."
---

Marketing messaging is not just a send problem. It depends on consent, audience segmentation, send timing, and channel economics.

## First rule: only send to opted-in users

Before you choose a channel, confirm:

- the user has valid marketing consent
- your campaign timing complies with your own policies and local rules
- opt-out handling is already wired

## FriendTalk vs SMS

| Channel | Best for | Strengths | Tradeoffs |
| --- | --- | --- | --- |
| FriendTalk | richer campaign content for Kakao-connected audiences | buttons, brand context, better visual experience | requires Kakao channel relationship |
| SMS | broad reach and simpler operational model | all phones, simple format, fewer prerequisites | less expressive and often costlier per message |

## Channel selection rules

Use FriendTalk when:

- the audience already follows your Kakao channel
- buttons or richer CTA flows matter
- branding and click-through matter more than universal reach

Use SMS when:

- the campaign must reach everyone in the target segment
- the content is short and direct
- Kakao channel relationship coverage is too low

## Campaign example

```ts
await kmsg.send({
  type: "SMS",
  to: "01012345678",
  text: "[Example] Weekend coupon: use code SPRING10 before Sunday.",
});
```

For Kakao-first campaigns, the exact send shape depends on the provider and template or channel setup you operate.

## Operational checklist

- segment users before building the recipient list
- suppress recent opt-outs and invalid numbers
- avoid blasting every campaign at the same hour
- measure delivery, open proxy metrics, and conversion separately

## Next steps

- [Message Type Guide](/en/guides/message-types/) for channel tradeoffs
- [Provider Selection](/en/guides/provider-selection/) if marketing volume changes your provider choice
- [Troubleshooting](/en/guides/troubleshooting/) if campaign sends fail validation or provider delivery
