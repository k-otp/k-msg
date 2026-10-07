---
title: "Case Study: K-OTP"
description: "How K-OTP, a production phone-verification API, uses k-msg: AlimTalk first with SMS failover, safe handling of unknown outcomes, delivery tracking, and WebOTP-friendly SMS."
---

[K-OTP](https://k-otp.dev) is a phone-verification OTP API for apps serving Korean users. It issues, delivers and verifies one-time codes, and it sends every message through k-msg. K-OTP is built by the k-msg maintainers, so it is also where k-msg's IWINV provider, error details and tracking store get exercised in production.

This page describes which k-msg features K-OTP uses and in what pattern. For K-OTP's own API, see its [documentation](https://docs.k-otp.dev).

## What K-OTP promises its callers

From the [K-OTP docs](https://docs.k-otp.dev):

- Codes go out as KakaoTalk AlimTalk by default, with an SMS fallback that is on by default. A caller can turn it off for one request with `smsFallback: false`.
- Every issue request carries an idempotency key. A retry with the same key never sends a second message.
- When the provider's outcome is unknown, K-OTP records it as ambiguous and never resends on its own. The caller retries with the same key.
- Delivery is tracked asynchronously, and on Android Chrome a code that arrives by SMS can be filled in automatically (WebOTP).

Each promise maps onto a k-msg feature.

| Need | k-msg feature |
| --- | --- |
| AlimTalk and SMS from one provider | `IWINVSendProvider` from `@k-msg/provider/iwinv/send` |
| SMS when the AlimTalk is not delivered | `failover` on `ALIMTALK` sends (IWINV `reSend`) |
| Timeouts and cancellation | per-call `signal` (and `fetch`) in the provider request context |
| Retry decisions | `normalizeProviderError` with a policy from `parseErrorRetryPolicyFromJson` |
| "Was it sent?" | `KMsgError` fields `httpStatus`, `providerErrorCode`, `providerErrorText`, and `getIWINVSendErrorReason` |
| Status lookups | `provider.getDeliveryStatus()` and the delivery status helpers in `@k-msg/core` |
| Delivery records | `createDrizzleDeliveryTrackingStore` with field encryption |
| Schema in migrations | `renderDrizzleSchemaSource` and `initializeSchema: false` |

K-OTP calls the provider directly instead of going through `KMsg`, because it already has its own queue, retries and routing. If you do not, start with `KMsg`: it adds routing, defaults and fallback text handling on top of the same providers.

## 1. AlimTalk first, SMS failover

An OTP send is an `ALIMTALK` message with `failover` set. With IWINV, k-msg maps `failover` to IWINV's own resend (`reSend`), so when the AlimTalk cannot be delivered (for example, the recipient does not use KakaoTalk), IWINV sends `fallbackContent` by SMS.

```ts
import { IWINVSendProvider } from "@k-msg/provider/iwinv/send";

const provider = new IWINVSendProvider({
  apiKey: env.IWINV_API_KEY, // AlimTalk
  smsApiKey: env.IWINV_SMS_API_KEY, // SMS/LMS
  smsAuthKey: env.IWINV_SMS_AUTH_KEY,
  smsCompanyId: env.IWINV_SMS_COMPANY_ID, // SMS status lookups
  senderNumber: "01000000000",
  smsSenderNumber: "01000000000",
});

const code = "123456";
const smsText = `[Example] Your verification code is ${code}.`;

const result = await provider.send(
  {
    type: "ALIMTALK",
    messageId: "0192f1c2-7a4e-7cc1-9a51-3f6f0b9d2e10", // one stable id per message
    to: "01012345678",
    templateId: "OTP_CODE",
    variables: { code },
    failover: {
      enabled: true, // false when the caller opted out of the SMS fallback
      fallbackChannel: "sms",
      fallbackContent: smsText,
    },
  },
  { signal: AbortSignal.timeout(10_000) },
);
```

IWINV only resends a message it accepted. When IWINV refuses the AlimTalk request outright, its resend never starts. K-OTP covers that case itself: if the error proves the message was not sent (see the next section), it switches the message to a plain `SMS` carrying the same fallback text. It never does this for an unknown outcome, so the fallback cannot duplicate an AlimTalk or IWINV's own resend.

Two details matter here:

- To turn the fallback off, pass `failover: { enabled: false }`. When `failover` is left out, the IWINV provider asks IWINV to resend whenever a sender number is configured. K-OTP always sets `enabled` explicitly, so `smsFallback: false` really means no SMS.
- The resend goes out from the sender number by default. When the SMS must come from a different number than the AlimTalk, pass it as `providerOptions.resendCallback`.

## 2. Retry, fail over, or stop

A failed send returns a `KMsgError`. Besides the normalized `code`, an IWINV send error carries the HTTP status, IWINV's own result code and text, and a named refusal reason when IWINV gave one (see [Send Errors](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/README.md#send-errors) in the IWINV provider README).

K-OTP asks two questions of each error:

1. **Is it worth retrying?** `normalizeProviderError` answers with `classification`, using a retry policy loaded from configuration with `parseErrorRetryPolicyFromJson`.
2. **Could the message have been sent anyway?** This decides whether an automatic retry or failover is safe. k-msg reports a 2xx answer without a result code as `PROVIDER_ERROR` because IWINV may have accepted the message; K-OTP treats that, timeouts, network errors and 5xx answers as an *unknown* outcome.

A simplified version of that decision:

```ts
import {
  type KMsgError,
  KMsgErrorCode,
  normalizeProviderError,
  parseErrorRetryPolicyFromJson,
} from "@k-msg/core";
import { getIWINVSendErrorReason } from "@k-msg/provider/iwinv/send";

const policy = parseErrorRetryPolicyFromJson(env.ERROR_RETRY_POLICY_JSON, {
  mode: "compat",
});

const UNKNOWN_OUTCOME_CODES = new Set<string>([
  KMsgErrorCode.NETWORK_ERROR,
  KMsgErrorCode.NETWORK_TIMEOUT,
  KMsgErrorCode.NETWORK_SERVICE_UNAVAILABLE,
  KMsgErrorCode.REQUEST_ABORTED,
  KMsgErrorCode.PROVIDER_ERROR,
  KMsgErrorCode.UNKNOWN_ERROR,
]);

function classify(error: KMsgError) {
  const normalized = normalizeProviderError(error, {
    mode: "compat",
    policy: policy ?? undefined,
  });
  const retryable = normalized.classification === "retryable";
  const status = normalized.httpStatus;

  // The provider may have taken the message: never resend or fail over.
  if (status !== undefined && (status >= 500 || status === 408 || status === 425)) {
    return { retryable, certainty: "unknown" as const };
  }
  // A 2xx answer is a refusal only with a provider result code or a named reason.
  const namedRefusal = getIWINVSendErrorReason(error) !== undefined;
  if (
    status !== undefined &&
    status >= 200 &&
    status < 300 &&
    normalized.providerErrorCode === undefined &&
    !namedRefusal
  ) {
    return { retryable, certainty: "unknown" as const };
  }
  if (UNKNOWN_OUTCOME_CODES.has(normalized.code)) {
    return { retryable, certainty: "unknown" as const };
  }
  return { retryable, certainty: "not_sent" as const };
}
```

- `not_sent` and retryable: retry later with the same message.
- `not_sent`, not retryable, AlimTalk with failover: send the SMS fallback (section 1).
- `unknown`: stop. K-OTP marks the issue as ambiguous and leaves the retry decision to the caller, who reuses the same idempotency key.

k-msg does not deduplicate sends, so idempotency stays in the application. K-OTP gives every message one stable `messageId`, which the provider echoes in `SendResult.messageId` and which keys the tracking record, so retries, status updates and lookups all refer to the same message.

`providerErrorText` is written by IWINV and can echo what was sent. K-OTP masks it before logging or storing it.

## 3. Delivery tracking and polling

K-OTP keeps one delivery record per message in a SQL database through k-msg's Drizzle tracking store, with the recipient and sender numbers encrypted and hashed:

```ts
import { createAesGcmFieldCryptoProvider } from "@k-msg/core";
import {
  createDrizzleDeliveryTrackingStore,
  renderDrizzleSchemaSource,
} from "@k-msg/messaging/adapters/cloudflare";

const fieldCryptoSchema = {
  enabled: true,
  mode: "secure",
  compatPlainColumns: false,
} as const;

const trackingStore = createDrizzleDeliveryTrackingStore({
  dialect: "postgres", // or "mysql" / "sqlite"
  db, // your Drizzle database
  fieldCryptoSchema,
  fieldCrypto: {
    config: {
      enabled: true,
      failMode: "closed",
      fields: { to: "encrypt+hash", from: "encrypt+hash", metadata: "encrypt" },
      provider: createAesGcmFieldCryptoProvider({ keys, hashKeys, activeKid: "v1" }),
    },
  },
  initializeSchema: false, // migrations own the table
});

// At build time, generate the Drizzle schema for migrations from the same options.
const schemaSource = renderDrizzleSchemaSource({
  dialect: "postgres",
  target: "tracking",
  fieldCryptoSchema,
});
```

- The store never creates tables at runtime. K-OTP renders the Drizzle schema with `renderDrizzleSchemaSource`, commits it next to its migrations, and its checks fail when the committed schema no longer matches what k-msg renders.
- Phone numbers are stored encrypted, with a keyed hash for lookups and no plain-text column (`compatPlainColumns: false`). With `failMode: "closed"`, a write fails rather than storing plain text when encryption fails.
- Key rotation uses the `kid` support described in [Key Management and Rotation](/en/guides/security/key-management-rotation/).

Messages without a final status are looked up again with `getDeliveryStatus`. K-OTP uses it for SMS lookups (AlimTalk lookups go through a batched history query of its own) and stops at a final status:

```ts
import { isTerminalDeliveryStatus } from "@k-msg/core";

const status = await provider.getDeliveryStatus(
  {
    providerMessageId: "123456789",
    type: "SMS",
    to: "01012345678",
    requestedAt: new Date(),
  },
  { signal: AbortSignal.timeout(5_000) },
);

if (status.isSuccess && status.value && isTerminalDeliveryStatus(status.value.status)) {
  // DELIVERED, FAILED, CANCELLED or UNKNOWN: stop polling this message.
}
```

K-OTP runs its own scheduler for this. If you do not have one, `DeliveryTrackingService` in `@k-msg/messaging` polls the store and the provider for you.

## 4. WebOTP-friendly SMS within 90 bytes

Android Chrome fills in a code automatically (WebOTP) only when it arrives by SMS and the message ends with an origin-bound line such as `@example.com #123456`. A Korean SMS holds 90 bytes, counted as one byte per ASCII character and two for any other character, such as Hangul. Longer text goes out as LMS.

K-OTP adds the WebOTP line only when the whole text still fits one SMS. Otherwise it sends the normal text without the line, so WebOTP never turns an SMS into an LMS. For an AlimTalk, only the SMS fallback text can carry the line.

```ts
import { estimateSmsBytes } from "k-msg";

const SMS_MAX_BYTES = 90;

function withWebOtpLine(body: string, host: string, otp: string): string {
  const candidate = `${body.trimEnd()}\n\n@${host} #${otp}`;
  // Count each line break twice in case it is sent as CRLF.
  const bytes = estimateSmsBytes(candidate) + (candidate.match(/\n/g)?.length ?? 0);
  return bytes <= SMS_MAX_BYTES ? candidate : body;
}
```

`estimateSmsBytes` counts the same way `KMsg` does when it picks SMS or LMS (`defaults.sms.autoLmsBytes`, 90 by default). For the AlimTalk fallback, IWINV also picks SMS or LMS by the length of `fallbackContent`, so the same limit keeps the fallback a single SMS.

## Runtime

K-OTP runs these pieces on a Workers-compatible edge runtime. The IWINV provider talks to IWINV only through `fetch`, and it forwards the per-call `signal` and `fetch` to every request it makes. For runnable Workers setups, see the [Example Guides](/en/guides/examples/).

## Related guides

- [OTP Verification](/en/guides/use-cases/otp-verification/): the basic OTP flow
- [Provider package](/en/guides/packages/provider/): IWINV failover mapping, transport context and status lookups
- [Messaging package](/en/guides/packages/messaging/): fallback text, delivery tracking and schema utilities
- [Core package](/en/guides/packages/core/): retry policies and `normalizeProviderError`
- [Field Crypto v1](/en/guides/security/field-crypto-v1/) and [Security Recipes](/en/guides/security/recipes/)
