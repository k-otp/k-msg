# k-msg

> Canonical docs: [k-msg.and.guide](https://k-msg.and.guide)

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
  templateId: "AUTH_OTP",
  variables: { code: "123456" },
});
```

## ALIMTALK Failover

Use standardized failover options on ALIMTALK:

```ts
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "AUTH_OTP",
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

## Field Crypto (Security Audit v1)

`@k-msg/core` and `@k-msg/messaging` now support field-level crypto with:

- `FieldMode`: `plain | encrypt | encrypt+hash | mask`
- secure default when `fieldCrypto` is enabled
- fail mode: `closed` by default (`open` must be explicit)
- AAD binding for `messageId/providerId/tableName/fieldPath`
- hash lookup (`to_hash`, `from_hash`) without deterministic encryption dependency

Quick example with AES-GCM provider:

```ts
import {
  createAesGcmFieldCryptoProvider,
  type FieldCryptoConfig,
} from "@k-msg/core";
import { createD1DeliveryTrackingStore } from "@k-msg/messaging/adapters/cloudflare";

const provider = createAesGcmFieldCryptoProvider({
  activeKid: "k-2026-01",
  keys: {
    "k-2026-01": process.env.KMSG_AES_KEY_BASE64URL!,
  },
  hashKeys: {
    "k-2026-01": process.env.KMSG_HMAC_KEY_BASE64URL!,
  },
  keyEncoding: "base64url",
  hashKeyEncoding: "base64url",
});

const fieldCrypto: FieldCryptoConfig = {
  enabled: true,
  failMode: "closed",
  fields: {
    to: "encrypt+hash",
    from: "encrypt+hash",
    "metadata.phoneNumber": "encrypt+hash",
  },
  provider,
};

const trackingStore = createD1DeliveryTrackingStore(env.DB, {
  tableName: "otp_delivery_tracking",
  fieldCryptoSchema: {
    enabled: true,
    mode: "secure",
    compatPlainColumns: false,
  },
  fieldCrypto: {
    config: fieldCrypto,
    tenantId: "tenant-a",
  },
});
```

Migration, threat model, and retention guidance are documented in:

- [`docs/security/field-crypto-v1.md`](./docs/security/field-crypto-v1.md)
- [`docs/security/field-crypto-basics.md`](./docs/security/field-crypto-basics.md)
- [`docs/migration/field-crypto-migration.md`](./docs/migration/field-crypto-migration.md)
- [`docs/compliance/kr-b2b-retention.md`](./docs/compliance/kr-b2b-retention.md)

If you are new to security terms, start here first:

- Astro docs (KO): [`/guides/security/glossary/`](https://k-msg.and.guide/guides/security/glossary/) -> [`/guides/security/recipes/`](https://k-msg.and.guide/guides/security/recipes/)
- Astro docs (EN): [`/en/guides/security/glossary/`](https://k-msg.and.guide/en/guides/security/glossary/) -> [`/en/guides/security/recipes/`](https://k-msg.and.guide/en/guides/security/recipes/)
- Root docs (plain language): [`docs/security/field-crypto-basics.md`](./docs/security/field-crypto-basics.md)

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

## Dependency Policy

- Core packages/apps (`packages/*`, `apps/*`) prioritize stability.
- Example projects (`examples/*`) are upgraded on a separate, periodic track.
- Use `bun run deps:outdated:core` and `bun run deps:outdated:examples` to review them independently.

## Release Ops

Release automation and changeset policy are documented in:

- [`./.sampo/README.md`](./.sampo/README.md)

## Breaking Changes

- Legacy `Platform` / `UniversalProvider` / `StandardRequest` public APIs were removed.
- Message discriminant is `type` (old `channel` naming was removed).
- `templateCode` was renamed to `templateId`.
