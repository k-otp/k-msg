---
editUrl: false
next: false
prev: false
title: "RcsFailoverOptions"
---

> **RcsFailoverOptions** = [`AlimTalkFailoverOptions`](/en/api/core/src/interfaces/alimtalkfailoveroptions/)

Defined in: [packages/core/src/types/message.ts:327](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L327)

SMS/LMS fallback for an RCS template message that the recipient's device or
carrier does not deliver. Same shape as [AlimTalkFailoverOptions](/en/api/core/src/interfaces/alimtalkfailoveroptions/):
`fallbackContent` and `fallbackTitle` are the fallback text, and
`fallbackChannel` picks SMS or LMS (`KMsg` sizes it from the content when
unset). Providers that cannot send a fallback ignore it; see each provider's
README for what it maps.
