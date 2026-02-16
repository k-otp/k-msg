# k-msg

Unified package that re-exports the main public API:

- `KMsg` from `@k-msg/messaging`
- Built-in providers from `@k-msg/provider`
- Core types/utilities from `@k-msg/core`

## Installation

```bash
npm install k-msg
# or
bun add k-msg
```

## Quick Start

```ts
import { IWINVProvider, KMsg, SolapiProvider } from "k-msg";

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
  templateCode: "AUTH_OTP",
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
