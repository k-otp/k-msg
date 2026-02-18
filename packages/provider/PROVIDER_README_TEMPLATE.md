# Provider README Template

Use this template when adding a new provider under `packages/provider/src/<provider>/`.

Suggested files:
- `packages/provider/src/<provider>/README.md` (English, recommended)
- `packages/provider/src/<provider>/README_ko.md` (Korean, optional)

---

# <ProviderName> Provider

One sentence: what this provider is and what it integrates (vendor/system).

- Provider id: `<provider-id>`
- Package: `@k-msg/provider`

## Supported Message Types

List what this provider can actually send via `send(options: SendOptions)`.

- `SMS`
- `LMS`
- `MMS`
- `ALIMTALK`
- `FRIENDTALK`
- `NSA`
- `VOICE`
- `FAX`
- `RCS_SMS`
- `RCS_LMS`
- `RCS_MMS`
- `RCS_TPL`
- `RCS_ITPL`
- `RCS_LTPL`

## Install

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

## Official Vendor Docs (Source)

Add the authoritative vendor documentation links used to implement this provider.

- <link 1>
- <link 2>

If the implementation intentionally differs from the vendor docs (e.g. header casing quirks, payload shape inconsistencies),
call it out explicitly in this README.

## Minimal Configuration

Explain the minimum config needed to construct the provider.

Required:
- `<field>`: <what it is>

Optional:
- `<field>`: <what it is>

Environment variables (optional, if `createDefault<Provider>()` exists):

```bash
<ENV_NAME>=...
```

## TypeScript Usage (Direct Provider)

```ts
import { <ProviderClass> } from "@k-msg/provider";

const provider = new <ProviderClass>({
  // ...
});

// SMS (or LMS/MMS)
const sms = await provider.send({
  type: "SMS",
  to: "01012345678",
  from: "01000000000",
  text: "hello",
});
if (sms.isFailure) throw sms.error;

// ALIMTALK
const alimtalk = await provider.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "YOUR_TEMPLATE_CODE",
  variables: { name: "Jane" },
});
if (alimtalk.isFailure) throw alimtalk.error;
```

## Usage (Recommended: with KMsg)

KMsg provides normalization, routing, hooks, and convenience APIs.

```ts
import { KMsg } from "@k-msg/messaging";
import { <ProviderClass> } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [new <ProviderClass>({ /* ... */ })],
  routing: { defaultProviderId: "<provider-id>" },
});

// Default SMS: type can be omitted
const result = await kmsg.send({ to: "01012345678", text: "hello" });
if (result.isFailure) throw result.error;
```

## Type-Specific Notes

Document only what is true for THIS provider (not the whole KMsg ecosystem).

Examples:
- SMS/LMS: sender requirements, subject/title handling, byte limits, auto-upgrade limitations (if any)
- MMS: supported media, file size limits, supported content types, upload steps (if any)
- ALIMTALK: template variables mapping rules, fallback (reSend) behavior, sender requirements for fallback
- RCS/NSA/VOICE/FAX: any vendor-specific required fields and limitations

## Common Options

KMsg standard options live under `options`:

- `options.scheduledAt?: Date`
- `options.country?: string`
- `options.customFields?: Record<string, string>`

Provider-specific escape hatch:

- `providerOptions?: Record<string, unknown>`

If you support commonly-used vendor fields via `providerOptions`, document the keys you recognize here.

## Error Mapping

Explain how vendor responses are mapped into `KMsgErrorCode` (at least the most common failures):

- `AUTHENTICATION_FAILED`
- `INSUFFICIENT_BALANCE`
- `TEMPLATE_NOT_FOUND`
- `INVALID_REQUEST`
- `RATE_LIMITED`
- `NETWORK_ERROR`
- `PROVIDER_ERROR`

## Health Check

Explain what `healthCheck()` validates (URLs, credentials presence, optional API probes, etc).

## Testing

Add:
- Unit tests for success and error mapping per supported type.
- Network mocking strategy (fetch mocking, fixtures, etc).

Typical commands:

```bash
bun run test:unit
bun run typecheck
```

