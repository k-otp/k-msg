---
title: "Troubleshooting"
description: "Common K-Message failures and the fastest path to diagnosis."
---

This guide covers the failures teams usually hit first: request validation issues, provider setup mistakes, template mismatches, and delivery gaps.

## Start with the Result object

K-Message returns structured failures.

```ts
const result = await kmsg.send({
  to: "01012345678",
  text: "test",
});

if (result.isFailure) {
  console.log(result.error.code);
  console.log(result.error.message);
  console.log(result.error.providerErrorCode);
}
```

Check these fields in order:

- `error.code`: normalized K-Message category
- `error.message`: readable explanation
- `error.providerErrorCode`: provider-specific detail when available

## Common problems

### `INVALID_REQUEST`

Typical causes:

- missing required fields like `to`, `text`, or `templateId`
- unsupported message-type-specific payload shape
- invalid phone number formatting
- variable interpolation mismatches

Fix:

- confirm the message type and required fields match
- use `templateId` for AlimTalk requests
- start with a minimal request and add fields incrementally

### Provider authentication or configuration failure

Typical causes:

- missing API key or secret
- wrong sender number
- provider base URL mismatch
- runtime secrets not loaded

Fix:

- verify environment variables in the runtime that actually sends
- test with the Mock Provider first
- then switch to one real provider with the smallest possible config

### AlimTalk template failure

Typical causes:

- `templateId` does not exist in the provider account
- variable names do not match the registered template
- fallback assumptions rely on provider behavior that is not configured

Fix:

- confirm the template exists in the target provider
- verify every variable key used in `variables`
- test one approved template before automating multiple templates

### Delivery does not match business expectations

Typical causes:

- wrong channel chosen for the scenario
- no fallback strategy for Kakao-first transactional flows
- queue or tracking not configured in runtime-heavy deployments

Fix:

- revisit [Message Type Guide](/en/guides/message-types/)
- use SMS-first for OTP
- use AlimTalk-first plus fallback for commerce notifications if required

## Fast debug checklist

1. Reproduce with the Mock Provider.
2. Reproduce with the smallest real-provider request.
3. Confirm environment variables in the real runtime, not only locally.
4. Inspect `error.code` and `providerErrorCode`.
5. Verify sender number, template, and routing assumptions.

## When the issue is probably outside K-Message

Escalate to provider configuration review when:

- provider credentials are valid but requests are still rejected
- a template is approved in one environment but missing in another
- sender numbers are not recognized by the provider account

## Next steps

- [Getting Started](/en/guides/getting-started/) if your baseline setup is still not stable
- [Provider Selection](/en/guides/provider-selection/) if the current provider fit is questionable
- [Use Case Guides](/en/guides/use-cases/) if the problem is really a channel-choice problem
