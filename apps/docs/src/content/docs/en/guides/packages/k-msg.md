---
title: "k-msg"
description: "Generated from `packages/k-msg/README.md`"
---
Unified package that re-exports the main public API:

- `KMsg` from `@k-msg/messaging`

Provider implementations and advanced/runtime-specific APIs should be imported directly from their packages:

- `@k-msg/provider`
- `@k-msg/provider/solapi`
- `@k-msg/messaging/tracking`
- `@k-msg/messaging/{sender,queue}`
- `@k-msg/messaging/adapters/*`

For core-only utilities in bundle-sensitive apps, prefer `k-msg/core` (or `@k-msg/core`) instead of importing them from `k-msg` root.

```ts
import { parseErrorRetryPolicyFromJson } from "k-msg/core";
// or
import { parseErrorRetryPolicyFromJson } from "@k-msg/core";
```

## Installation

```bash
npm install k-msg
# or
bun add k-msg
```

## Quick Start

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
    },
  },
  defaults: {
    sms: { autoLmsBytes: 90 },
  },
});

// Default SMS (type omitted)
await kmsg.send({ to: "01012345678", text: "hello" });

// AlimTalk
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## Runtime Adapters

Runtime-specific implementations are available via subpaths:

- `k-msg/adapters/bun`
- `k-msg/adapters/node`
- `k-msg/adapters/cloudflare`

```ts
import { SqliteDeliveryTrackingStore } from "k-msg/adapters/bun";
import { createD1DeliveryTrackingStore } from "k-msg/adapters/cloudflare";
```

