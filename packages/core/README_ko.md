# @k-msg/core

> 공식 문서: [k-msg.and.guide](https://k-msg.and.guide)

`k-msg` 생태계를 위한 핵심 타입/유틸리티 패키지입니다.

이 패키지는 의도적으로 로우레벨로 유지됩니다:

- 표준 메시지 모델: `MessageType`, `SendInput`, `SendOptions`, `SendResult`
- Provider 인터페이스: `Provider`, 선택 capability `BalanceProvider`
- Result 패턴: `Result`, `ok`, `fail`
- 에러: `KMsgError`, `KMsgErrorCode`
- 복원력 유틸: retry / circuit-breaker / rate-limit / bulk operation

최종 사용자용 "send" 경험이 필요하면 `@k-msg/messaging`(또는 `k-msg`)의 `KMsg`를 사용하세요.

## 설치

```bash
npm install @k-msg/core
# or
bun add @k-msg/core
```

## 예시: Provider 구현

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
