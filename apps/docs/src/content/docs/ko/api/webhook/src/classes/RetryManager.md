---
editUrl: false
next: false
prev: false
title: "RetryManager"
---

Defined in: [packages/webhook/src/retry/retry.manager.ts:23](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L23)

Webhook 재시도 관리자
지수 백오프와 지터를 사용한 스마트 재시도 로직

## Constructors

### Constructor

> **new RetryManager**(`webhookConfig`): `RetryManager`

Defined in: [packages/webhook/src/retry/retry.manager.ts:26](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L26)

#### Parameters

##### webhookConfig

[`WebhookConfig`](/api/webhook/src/interfaces/webhookconfig/)

#### Returns

`RetryManager`

## Methods

### calculateNextRetry()

> **calculateNextRetry**(`attemptNumber`): `Date`

Defined in: [packages/webhook/src/retry/retry.manager.ts:39](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L39)

다음 재시도 시간 계산

#### Parameters

##### attemptNumber

`number`

#### Returns

`Date`

***

### calculateRetryStats()

> **calculateRetryStats**(`attempts`): `object`

Defined in: [packages/webhook/src/retry/retry.manager.ts:121](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L121)

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

Defined in: [packages/webhook/src/retry/retry.manager.ts:183](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L183)

백오프 지연 시간 계산 (테스트용)

#### Parameters

##### attemptNumber

`number`

#### Returns

`number`

***

### getConfig()

> **getConfig**(): `RetryConfig`

Defined in: [packages/webhook/src/retry/retry.manager.ts:176](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L176)

현재 재시도 설정 반환

#### Returns

`RetryConfig`

***

### shouldRetry()

> **shouldRetry**(`attemptNumber`, `error?`): `boolean`

Defined in: [packages/webhook/src/retry/retry.manager.ts:64](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L64)

재시도 가능 여부 확인

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

Defined in: [packages/webhook/src/retry/retry.manager.ts:101](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L101)

HTTP 상태 코드별 재시도 정책

#### Parameters

##### statusCode

`number`

#### Returns

`boolean`

***

### updateConfig()

> **updateConfig**(`config`): `void`

Defined in: [packages/webhook/src/retry/retry.manager.ts:169](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/retry/retry.manager.ts#L169)

재시도 설정 업데이트

#### Parameters

##### config

`Partial`\<`RetryConfig`\>

#### Returns

`void`
