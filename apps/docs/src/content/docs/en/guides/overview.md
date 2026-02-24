---
title: "Overview"
description: "Generated from `README.md`"
---
Korean multi-channel messaging toolkit with pluggable providers.

Unified end-user API:

- `new KMsg({ providers, routing, defaults, hooks })`
- `kmsg.send({ type, ... })` (default SMS when `type` is omitted)


## What is K-Message?

K-Message is a TypeScript library for Korean multi-channel messaging platforms.
Manage SMS, LMS, AlimTalk, and FriendTalk with a single unified API.

### Key Features

- **Multi-channel sending with one API**: Unified management of SMS, LMS, AlimTalk, FriendTalk
- **Multiple provider support**: Pluggable support for Korean messaging providers (SOLAPI, IWINV, Aligo)
- **TypeScript native**: Full type safety and IDE autocomplete support
- **Result pattern**: Explicit error handling for safe business logic
- **Bun optimized**: Performance optimized for modern JavaScript runtime

### Quick Example

```ts
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";

const kmsg = new KMsg({ providers: [new IWINVProvider({ apiKey: process.env.IWINV_API_KEY! })] });
await kmsg.send({ to: "01012345678", text: "Hello!" });
```

### When to Use

- When you need SMS/AlimTalk for Korean market services
- When using multiple messaging providers or planning provider migration
- TypeScript projects requiring type-safe messaging APIs
- When automatic failover is needed for high availability

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

- [`docs/security/field-crypto-v1.md`](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-v1.md)
- [`docs/security/field-crypto-basics.md`](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-basics.md)
- [`docs/security/key-rotation-playbook.md`](https://github.com/k-otp/k-msg/blob/main/docs/security/key-rotation-playbook.md)
- [`docs/security/migration-cli-runbook.md`](https://github.com/k-otp/k-msg/blob/main/docs/security/migration-cli-runbook.md)
- [`docs/security/crypto-control-signals.md`](https://github.com/k-otp/k-msg/blob/main/docs/security/crypto-control-signals.md)
- [`docs/migration/field-crypto-migration.md`](https://github.com/k-otp/k-msg/blob/main/docs/migration/field-crypto-migration.md)
- [`docs/compliance/kr-b2b-retention.md`](https://github.com/k-otp/k-msg/blob/main/docs/compliance/kr-b2b-retention.md)

If you are new to security terms, start here first:

- Astro docs (KO): [`/guides/security/glossary/`](https://k-msg.and.guide/guides/security/glossary/) -> [`/guides/security/recipes/`](https://k-msg.and.guide/guides/security/recipes/)
- Astro docs (EN): [`/en/guides/security/glossary/`](https://k-msg.and.guide/en/guides/security/glossary/) -> [`/en/guides/security/recipes/`](https://k-msg.and.guide/en/guides/security/recipes/)
- Root docs (plain language): [`docs/security/field-crypto-basics.md`](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-basics.md)

## Project Roadmap

Future development follows the implementation-aware roadmap:

- English roadmap: [`ROADMAP.md`](https://github.com/k-otp/k-msg/blob/main/ROADMAP.md)
- Korean roadmap: [`ROADMAP_ko.md`](https://github.com/k-otp/k-msg/blob/main/ROADMAP_ko.md)

The roadmap is a living document and is updated quarterly based on operational metrics and user feedback.

## Monorepo Packages

- `@k-msg/core`: core types/utilities (`Provider`, `SendOptions`, `Result`, `KMsgError`, ...)
- `@k-msg/messaging`: `KMsg` facade (normalization + routing)
- `@k-msg/provider`: runtime-neutral built-in providers (IWINV / Aligo / Mock)
- `@k-msg/provider/solapi`: SOLAPI provider (`solapi` must be installed by the user app)
- `@k-msg/template`: template interpolation utilities
- `@k-msg/analytics`, `@k-msg/webhook`, `@k-msg/channel`: optional supporting packages

## Dependency Policy

- Core packages/apps (`packages/*`, `apps/*`) prioritize stability.
- Example projects (`examples/*`) are upgraded on a separate, periodic track.
- Use `bun run deps:outdated:core` and `bun run deps:outdated:examples` to review them independently.

## Release Ops

Release automation and changeset policy are documented in:

- [`./.sampo/README.md`](https://github.com/k-otp/k-msg/blob/main/.sampo/README.md)

## Breaking Changes

- Legacy `Platform` / `UniversalProvider` / `StandardRequest` public APIs were removed.
- Message discriminant is `type` (old `channel` naming was removed).
- `templateCode` was renamed to `templateId`.
