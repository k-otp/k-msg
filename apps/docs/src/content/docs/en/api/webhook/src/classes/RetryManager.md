---
editUrl: false
next: false
prev: false
title: "RetryManager"
---

Defined in: [packages/webhook/src/retry/retry.manager.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L23)

Webhook 재시도 관리자
지수 백오프와 지터를 사용한 스마트 재시도 로직

## Constructors

### Constructor

> **new RetryManager**(`webhookConfig`): `RetryManager`

Defined in: [packages/webhook/src/retry/retry.manager.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L26)

#### Parameters

##### webhookConfig

[`WebhookConfig`](/en/api/webhook/src/interfaces/webhookconfig/)

#### Returns

`RetryManager`

## Methods

### calculateNextRetry()

> **calculateNextRetry**(`attemptNumber`): `Date`

Defined in: [packages/webhook/src/retry/retry.manager.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L39)

다음 재시도 시간 계산

#### Parameters

##### attemptNumber

`number`

#### Returns

`Date`

***

### calculateRetryStats()

> **calculateRetryStats**(`attempts`): `object`

Defined in: [packages/webhook/src/retry/retry.manager.ts:125](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L125)

재시도 통계 계산

#### Parameters

##### attempts

`RetryAttempt`[]

#### Returns

`object`

##### averageDelayMs

> **averageDelayMs**: `number`

##### failedAttempts

> **failedAttempts**: `number`

##### successfulAttempts

> **successfulAttempts**: `number`

##### totalAttempts

> **totalAttempts**: `number`

##### totalTimeMs

> **totalTimeMs**: `number`

***

### getBackoffDelay()

> **getBackoffDelay**(`attemptNumber`): `number`

Defined in: [packages/webhook/src/retry/retry.manager.ts:187](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L187)

백오프 지연 시간 계산 (테스트용)

#### Parameters

##### attemptNumber

`number`

#### Returns

`number`

***

### getConfig()

> **getConfig**(): `RetryConfig`

Defined in: [packages/webhook/src/retry/retry.manager.ts:180](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L180)

현재 재시도 설정 반환

#### Returns

`RetryConfig`

***

### isRetryableError()

> **isRetryableError**(`error`): `boolean`

Defined in: [packages/webhook/src/retry/retry.manager.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L85)

재시도 가능한 에러인지 판단

#### Parameters

##### error

`Error`

#### Returns

`boolean`

***

### shouldRetry()

> **shouldRetry**(`attemptNumber`, `error?`): `boolean`

Defined in: [packages/webhook/src/retry/retry.manager.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L68)

재시도 가능 여부 확인

Applies the global `maxRetries` budget and, when an `error` is given, the
error-type policy of `isRetryableError`. Per-endpoint budgets are enforced
by the delivery loop, which calls `shouldRetryStatus`/`isRetryableError`.

#### Parameters

##### attemptNumber

`number`

##### error?

`Error`

#### Returns

`boolean`

***

### shouldRetryStatus()

> **shouldRetryStatus**(`statusCode`): `boolean`

Defined in: [packages/webhook/src/retry/retry.manager.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L105)

HTTP 상태 코드별 재시도 정책

#### Parameters

##### statusCode

`number`

#### Returns

`boolean`

***

### updateConfig()

> **updateConfig**(`config`): `void`

Defined in: [packages/webhook/src/retry/retry.manager.ts:173](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/retry/retry.manager.ts#L173)

재시도 설정 업데이트

#### Parameters

##### config

`Partial`\<`RetryConfig`\>

#### Returns

`void`
