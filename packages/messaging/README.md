# @k-msg/messaging

High-level messaging facade for `k-msg`.

This package provides `KMsg`, which normalizes user input, routes to a provider, and returns a `Result`.

## Installation

```bash
npm install @k-msg/messaging @k-msg/core
# or
bun add @k-msg/messaging @k-msg/core
```

## Quick Start

```ts
import { KMsg } from "@k-msg/messaging";
import { SolapiProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
  defaults: {
    from: "01000000000",
    sms: { autoLmsBytes: 90 },
  },
});

// Default SMS (type omitted). If the content is long, it can auto-upgrade to LMS.
await kmsg.send({ to: "01012345678", text: "hello" });

// Explicit typed send
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateCode: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## Routing

```ts
import { KMsg } from "@k-msg/messaging";
import { IWINVProvider, SolapiProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
    }),
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
      kakaoPfId: process.env.SOLAPI_KAKAO_PF_ID,
      rcsBrandId: process.env.SOLAPI_RCS_BRAND_ID,
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
      SMS: ["solapi"],
    },
    strategy: "first",
  },
});
```

## Bulk Sending

Use `sendMany()` for controlled concurrency.

```ts
const results = await kmsg.sendMany(
  [
    { to: "01011112222", text: "hello 1" },
    { to: "01033334444", text: "hello 2" },
  ],
  { concurrency: 10 },
);
```

## Delivery Tracking (PULL)

After a message is accepted by a provider (including scheduled sends), you can **poll provider status APIs** to
reconcile delivery state and update your internal records.

`DeliveryTrackingService` is storage-backed and supports:
- In-memory store (no DB)
- SQLite (default: `./kmsg.sqlite`, via `bun:sqlite`)
- Bun.SQL store (sqlite/postgres/mysql, via `Bun.SQL`)

```ts
import { KMsg, createDeliveryTrackingHooks, DeliveryTrackingService } from "@k-msg/messaging";
import { SolapiProvider } from "@k-msg/provider";

const providers = [
  new SolapiProvider({
    apiKey: process.env.SOLAPI_API_KEY!,
    apiSecret: process.env.SOLAPI_API_SECRET!,
  }),
];

const tracking = new DeliveryTrackingService({ providers });

const kmsg = new KMsg({
  providers,
  hooks: createDeliveryTrackingHooks(tracking),
});

// On successful send, providerMessageId is recorded into the tracking store.
await kmsg.send({ to: "01012345678", text: "hello" });

// Run as a cron/worker loop
tracking.start();
// or single pass (manual/cron)
await tracking.runOnce();
```
