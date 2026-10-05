# @k-msg/provider

> Canonical docs: [k-msg.and.guide](https://k-msg.and.guide)

Provider implementations for `k-msg` (SendOptions + Result based).

## Installation

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

For SOLAPI provider usage, install the latest `solapi` in your app as well. `@k-msg/provider` supports both the current v6 line and the previous v5 peer range:

```bash
npm install solapi
# or
bun add solapi
```

## Built-in Providers

- `SolapiProvider` (SOLAPI)
- `IWINVProvider` (IWINV AlimTalk, SMS v2 and/or RCS templates; see `src/iwinv/README.md`)
- `AligoProvider` (Aligo)
- `MockProvider` (no vendor calls, for tests and local runs). Pass `{ id }` to give each instance its own provider id, for example to try `routing.byType` with two mocks; the id defaults to `"mock"`.

All providers implement the `Provider` interface from `@k-msg/core`:

- `supportedTypes` declares supported message `type`s
- `send(options: SendOptions, context?: ProviderRequestContext)` returns `Result<SendResult, KMsgError>` (never throws)
- some providers also implement optional capability `getBalance(query?)`

### Per-operation transport context

`ProviderRequestContext` can carry an `AbortSignal` and an operation-scoped
`fetch` implementation. Check `provider.transportCapabilities` before relying
on either feature; a missing declaration is treated as unsupported.

| Provider | AbortSignal | Injectable fetch | Notes |
| --- | --- | --- | --- |
| `iwinv` | supported | supported | `send` and `getDeliveryStatus` forward the context to every underlying request |
| `aligo` | supported | supported | every send channel uses the shared fetch transport |
| `solapi` | supported | unsupported | the SOLAPI SDK takes no signal or fetch, so the provider checks the signal before each SDK call and stops waiting when it aborts; a send request the SDK already made cannot be cancelled and SOLAPI may still deliver it, so that case returns `REQUEST_ABORTED` (not retried by default) even for a timeout |
| `mock` | supported | unsupported | simulated delays observe the signal; no HTTP transport is used |

```ts
const controller = new AbortController();
const result = await provider.send(input, {
  signal: controller.signal,
  fetch: globalThis.fetch,
});
```

Import paths:

- `@k-msg/provider`: runtime-neutral exports (`IWINVProvider`, `AligoProvider`, onboarding helpers, mock)
- `@k-msg/provider/aligo`: Aligo provider exports
- `@k-msg/provider/solapi`: SOLAPI provider exports (`solapi` must be installed by the user app)

## Provider Onboarding Matrix

Single source of truth: `packages/provider/src/onboarding/specs.ts`

| Provider | Channel onboarding | Template API | plusId policy | plusId inference | Live test support |
| --- | --- | --- | --- | --- | --- |
| `iwinv` | manual (console) | available | optional | unsupported | supported |
| `aligo` | api | available | required_if_no_inference | supported | supported |
| `solapi` | none (vendor metadata) | unavailable | optional | unsupported | partial |
| `mock` | api (test fixture) | available | optional | supported | none |

Runtime access:

- Each built-in provider exposes `getOnboardingSpec()`.
- Registry helpers are exported: `getProviderOnboardingSpec`, `listProviderOnboardingSpecs`, `providerOnboardingSpecs`.

Interpretation notes:

- `channel onboarding` here describes the vendor prerequisite path (`manual`, `api`, `none`), not a toolkit-managed approval state.
- When the CLI stores `onboarding.manualChecks`, it is recording operator evidence/notes for external vendor steps rather than becoming the approval source of truth.

## ALIMTALK template variables

`variables` are matched to the template's `#{name}` placeholders by name:

| Provider | Sent as |
| --- | --- |
| `iwinv` | `templateParam`, one value per distinct placeholder name, in order of first appearance in the content and then the button links |
| `aligo` | `message_1`, the template text with the values filled in |
| `solapi` | `kakaoOptions.variables`; SOLAPI fills the template |

IWINV and Aligo need the template text for this. They take it from `providerOptions.templateContent`, or else look the template up (IWINV `POST /api/template/`, Aligo `/akv10/template/list/`) through the send's request context and keep it for 10 minutes per provider instance. A placeholder without a value in `variables` (no key, or `undefined`) fails the send with `INVALID_REQUEST` before anything is sent. IWINV skips the lookup when `variables` is empty and no `templateContent` is given, and sends `providerOptions.templateParam` as-is; see `src/iwinv/README.md`.

## Delivery status lookup

`DeliveryTrackingService` in `@k-msg/messaging` polls `provider.getDeliveryStatus()`.

| Provider | `getDeliveryStatus` |
| --- | --- |
| `iwinv` | AlimTalk history; SMS/LMS/MMS history needs `smsCompanyId`; RCS history, matched by brand, template, recipient and request time (IWINV's send answer has no message key) |
| `solapi` | SOLAPI message list |
| `aligo` | not implemented |

Aligo has result lookups (`/akv10/history/detail/`, `/sms_list/`) but does not publish the result codes they return, so `AligoProvider` has no `getDeliveryStatus()`. Tracked Aligo messages stay `SENT` until `polling.maxTrackingDurationMs` (24 h by default) marks them `UNKNOWN`; set `polling.unsupportedProviderStrategy: "unknown"` to settle them at the first poll instead. For the same reason tracking-based API failover never resends an Aligo AlimTalk: Aligo sends its own fallback when `failover.enabled` is set.

## ALIMTALK failover responsibilities

`failover` on ALIMTALK is standardized in `@k-msg/core`, but provider-native mapping differs.

| Provider | Native mapping | Warning |
| --- | --- | --- |
| `iwinv` | `reSend`, `resendType`, `resendContent`, `resendTitle` | none (treated as native) |
| `solapi` | `kakao.disableSms`, `text`, `subject` | `FAILOVER_PARTIAL_PROVIDER` only without a sender number |
| `aligo` | `failover`, `fmessage_1`, `fsubject_1` | `FAILOVER_PARTIAL_PROVIDER` |
| `mock` | no native mapping | `FAILOVER_UNSUPPORTED_PROVIDER` |

Boundary:

- Provider package maps to vendor-native fields and returns warning metadata.
- `iwinv` sends `failover.fallbackContent` as `resendContent` (`resendType: "N"`); without it, IWINV resends the AlimTalk text. IWINV picks SMS or LMS by the text's length.
- Tracking-based API-level fallback retry (delivery polling + SMS/LMS re-send) is handled by `@k-msg/messaging`, only for sends that return one of the warnings above.
- `solapi` sends the fallback itself (`kakao.disableSms: false`) when the AlimTalk has a sender number (`from` or `defaultFrom`), so it returns no warning then; otherwise SOLAPI cannot replace it and the send is marked for API-level fallback.

## RCS failover

`failover` on `RCS_TPL`/`RCS_ITPL`/`RCS_LTPL` (`RcsFailoverOptions` in `@k-msg/core`, the same shape as ALIMTALK's) asks for an SMS/LMS fallback when the RCS message is not delivered. `KMsg` fills its placeholders and sizes it for SMS or LMS as for ALIMTALK. Tracking-based API-level fallback does not apply to RCS.

| Provider | Native mapping | Warning |
| --- | --- | --- |
| `iwinv` | `reSend`, `resendType`, `resendContent`, `resendTitle` (`RCS_TPL` only) | none (treated as native) |
| `solapi` | not mapped; SOLAPI's own fallback follows `rcs.disableSms` | `FAILOVER_UNSUPPORTED_PROVIDER` |

## Usage (with KMsg)

```ts
import { KMsg } from "@k-msg/messaging";
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

## Provider Implementation Structure

For provider code organization conventions (facade + domain modules + shared utility rules), see:

- `packages/provider/src/PROVIDER_STRUCTURE.md`
