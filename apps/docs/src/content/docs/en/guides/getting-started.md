---
title: "Getting Started"
description: "Send your first message with K-Message step by step."
---

This guide shows the fastest path to a working `k-msg` setup. It starts with the Mock Provider so you can verify your send flow before wiring real provider credentials.

## What K-Message gives you

K-Message is a TypeScript toolkit for Korean messaging channels:

- SMS and LMS
- Kakao AlimTalk and FriendTalk
- Provider routing across SOLAPI, IWINV, Aligo, and Mock
- Result-based error handling instead of exception-heavy control flow

If you want the smallest possible entry point, start with `k-msg` and `@k-msg/provider`.

## Install

```bash
bun add k-msg @k-msg/provider
```

```bash
npm install k-msg @k-msg/provider
```

## First send with the Mock Provider

```ts
import { KMsg } from "k-msg";
import { MockProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [new MockProvider()],
});

const result = await kmsg.send({
  to: "01012345678",
  text: "Hello from K-Message!",
});

if (result.isSuccess) {
  console.log("sent:", result.value.messageId);
} else {
  console.error("failed:", result.error.code, result.error.message);
}
```

Why this is the recommended first step:

- no API key is required
- request validation still runs
- your application code already uses the real `KMsg` surface

## Result pattern

K-Message returns a `Result` object.

```ts
const result = await kmsg.send({
  to: "01012345678",
  text: "Verification code: 123456",
});

if (result.isSuccess) {
  console.log(result.value.status);
} else {
  console.log(result.error.code);
  console.log(result.error.providerErrorCode);
}
```

This makes it easy to branch on business-safe failure states without relying on `try/catch` everywhere.

## Switch to a real provider

Once the Mock Provider flow works, replace it with a real provider instance.

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
```

For AlimTalk or mixed-provider setups, add routing explicitly:

```ts
const kmsg = KMsg.builder()
  .addProvider(
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  )
  .withRouting({
    defaultProviderId: "solapi",
  })
  .build();
```

## What to read next

- [Package Selection](/en/guides/package-selection/) if you need a smaller or more specialized package set
- [Provider Selection](/en/guides/provider-selection/) if you are choosing between IWINV, SOLAPI, and Aligo
- [Message Type Guide](/en/guides/message-types/) if you are deciding between SMS, LMS, AlimTalk, and FriendTalk
- [Troubleshooting](/en/guides/troubleshooting/) if your first send does not behave as expected
