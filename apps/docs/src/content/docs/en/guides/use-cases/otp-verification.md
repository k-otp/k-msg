---
title: "OTP Verification"
description: "Build SMS-first OTP delivery with K-Message."
---

OTP flows are security-critical. The primary goal is reliable, fast delivery to the widest possible user base.

## Why SMS is usually the default

SMS is typically the safest first choice for OTP because:

- it reaches users without requiring Kakao installation
- it does not depend on a pre-approved Kakao template
- it matches short, urgent messages well

## Core requirements

- high deliverability
- low latency
- short message format
- expiration and retry control outside the messaging layer

## Basic send example

```ts
import { KMsg } from "k-msg";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
});

await kmsg.send({
  to: "01012345678",
  text: "[Example] Your verification code is 123456. It expires in 3 minutes.",
});
```

## Application rules that should live outside K-Message

K-Message handles sending. Your application should still own:

- OTP generation
- expiration windows
- request rate limiting
- replay prevention
- attempt counting per user or phone number

## Recommended operational rules

- expire OTPs within a short window such as 3 to 5 minutes
- throttle repeated requests from the same phone number
- do not reuse the same OTP across separate flows
- log normalized send failures for abuse and incident review

## When to consider Kakao instead

AlimTalk can work for some verified-user flows, but it should not be your first choice when universal reach is mandatory.

Use Kakao only if:

- your audience is already Kakao-heavy
- template registration overhead is acceptable
- a missed OTP can safely fall back to SMS

## Next steps

- [Message Type Guide](/en/guides/message-types/) for channel tradeoffs
- [Troubleshooting](/en/guides/troubleshooting/) if OTP sends fail in production
