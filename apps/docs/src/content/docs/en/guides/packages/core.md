---
title: "@k-msg/core"
description: "Generated from `packages/core/README.md`"
---
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

