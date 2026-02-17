# k-msg

Korean multi-channel messaging toolkit with pluggable providers.

Unified end-user API:

- `new KMsg({ providers, routing, defaults, hooks })`
- `kmsg.send({ type, ... })` (default SMS when `type` is omitted)

## Installation

```bash
npm install k-msg
# or
bun add k-msg
```

If you use SOLAPI, also install `solapi` and import from `@k-msg/provider/solapi`.

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
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
      smsSenderNumber: "01000000000",
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv",
    },
  },
  defaults: {
    from: "01000000000",
    sms: { autoLmsBytes: 90 },
  },
});

// Default SMS (type omitted)
await kmsg.send({ to: "01012345678", text: "hello" });

// Typed send (AlimTalk)
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateCode: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## ALIMTALK Failover

Use standardized failover options on ALIMTALK:

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateCode: "AUTH_OTP",
  variables: { code: "123456" },
  failover: {
    enabled: true,
    fallbackChannel: "sms",
    fallbackContent: "Fallback SMS text",
    fallbackTitle: "Fallback title (LMS)",
  },
});
```

If provider-native mapping is unsupported or partial, providers return warnings such as:

- `FAILOVER_UNSUPPORTED_PROVIDER`
- `FAILOVER_PARTIAL_PROVIDER`

Delivery-tracking API-level fallback can then auto-retry SMS/LMS once when:

- message type is `ALIMTALK`
- failover is enabled
- delivery status becomes `FAILED`
- failure is classified as non-Kakao-user failure

## Project Roadmap

Future development follows the implementation-aware roadmap:

- English roadmap: [`ROADMAP.md`](./ROADMAP.md)
- Korean roadmap: [`ROADMAP_ko.md`](./ROADMAP_ko.md)

The roadmap is a living document and is updated quarterly based on operational metrics and user feedback.

## Monorepo Packages

- `@k-msg/core`: core types/utilities (`Provider`, `SendOptions`, `Result`, `KMsgError`, ...)
- `@k-msg/messaging`: `KMsg` facade (normalization + routing)
- `@k-msg/provider`: built-in providers (SOLAPI / IWINV / Aligo)
- `@k-msg/template`: template interpolation utilities
- `@k-msg/analytics`, `@k-msg/webhook`, `@k-msg/channel`: optional supporting packages

## Release Ops

Release automation and changeset policy are documented in:

- [`./.sampo/README.md`](./.sampo/README.md)

## Breaking Changes

- Legacy `Platform` / `UniversalProvider` / `StandardRequest` public APIs were removed.
- Message discriminant is `type` (old `channel` naming was removed).
- `templateId` was renamed to `templateCode`.
