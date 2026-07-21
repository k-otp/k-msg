# @k-msg/core

> Canonical docs: [k-msg.and.guide](https://k-msg.and.guide)

Core types and utilities for the `k-msg` ecosystem.

This package intentionally stays low-level:

- Standard message model: `MessageType`, `SendInput`, `SendOptions`, `SendResult`
- Provider interfaces: `Provider`, optional capability `BalanceProvider`
- Result pattern: `Result`, `ok`, `fail`
- Errors: `KMsgError`, `KMsgErrorCode`
- Resilience helpers: retry / circuit-breaker / rate-limit / bulk operation

If you want the end-user "send" experience, use `KMsg` from `@k-msg/messaging` (or `k-msg`).

## Installation

```bash
npm install @k-msg/core
# or
bun add @k-msg/core
```

## Retry policy from JSON

Use the core parser for environment-backed provider policies instead of
reimplementing status and retry-delay normalization in each application:

```ts
import {
  normalizeProviderError,
  parseErrorRetryPolicyFromJson,
} from "@k-msg/core";

const policy = parseErrorRetryPolicyFromJson(
  JSON.stringify({
    retryableCodes: ["NETWORK_TIMEOUT"],
    nonRetryableStatuses: ["400"],
    retryableStatuses: ["429", "503"],
    retryAfterMs: {
      defaultMs: 1_000,
      byCode: { VENDOR_BUSY: 2_000 },
      byStatus: { "429": 3_000 },
    },
  }),
  { mode: "compat" },
);

const normalized = normalizeProviderError(providerError, {
  mode: "compat",
  policy: policy ?? undefined,
});
```

Policy keys are trimmed and normalized case-insensitively. In conflicts,
explicit non-retryable entries win. Declarative retry delays resolve in this
order: direct error metadata, provider error code, canonical `KMsgErrorCode`,
HTTP status, then `defaultMs`. Existing function-based `retryAfterMs(error)`
resolvers remain supported as overrides.

## Example: Implement a Provider

```ts
import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type MessageType,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";

export class MyProvider implements Provider {
  readonly id = "my-provider";
  readonly name = "My Provider";
  readonly supportedTypes: readonly MessageType[] = ["SMS"];

  async healthCheck(): Promise<ProviderHealthStatus> {
    return { healthy: true, issues: [] };
  }

  async send(options: SendOptions): Promise<Result<SendResult, KMsgError>> {
    const messageId = options.messageId || crypto.randomUUID();

    if (options.type !== "SMS") {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          `Unsupported type: ${options.type}`,
          { providerId: this.id, type: options.type },
        ),
      );
    }

    // ... send SMS here ...

    return ok({
      messageId,
      providerId: this.id,
      status: "SENT",
      type: options.type,
      to: options.to,
    });
  }
}
```
