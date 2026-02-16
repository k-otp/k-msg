# @k-msg/provider

Provider implementations for `k-msg` (SendOptions + Result based).

## Installation

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

## Built-in Providers

- `SolapiProvider` (SOLAPI)
- `IWINVProvider` (IWINV AlimTalk + optional SMS v2)
- `AligoProvider` (Aligo)

All providers implement the `Provider` interface from `@k-msg/core`:

- `supportedTypes` declares supported message `type`s
- `send(options: SendOptions)` returns `Result<SendResult, KMsgError>` (never throws)

## ALIMTALK failover responsibilities

`failover` on ALIMTALK is standardized in `@k-msg/core`, but provider-native mapping differs.

| Provider | Native mapping | Warning |
| --- | --- | --- |
| `iwinv` | `reSend`, `resendType`, `resendContent`, `resendTitle` | none (treated as native) |
| `solapi` | `kakao.disableSms`, `text`, `subject` | `FAILOVER_PARTIAL_PROVIDER` |
| `aligo` | `failover`, `fmessage_1`, `fsubject_1` | `FAILOVER_PARTIAL_PROVIDER` |
| `mock` | no native mapping | `FAILOVER_UNSUPPORTED_PROVIDER` |

Boundary:

- Provider package maps to vendor-native fields and returns warning metadata.
- Tracking-based API-level fallback retry (delivery polling + SMS/LMS re-send) is handled by `@k-msg/messaging`.

## Usage (with KMsg)

```ts
import { KMsg } from "@k-msg/messaging";
import { IWINVProvider, SolapiProvider } from "@k-msg/provider";

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
    byType: { ALIMTALK: "iwinv" },
  },
});

await kmsg.send({ to: "01012345678", text: "hello" });
```

## Provider README Template

When adding a new provider, start from `packages/provider/PROVIDER_README_TEMPLATE.md` and include official vendor doc links.
