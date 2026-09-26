---
editUrl: false
next: false
prev: false
title: "SecurityManager"
---

Defined in: [packages/webhook/src/security/security.manager.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L21)

Webhook 보안 관리자
서명 생성 및 검증을 담당

## Constructors

### Constructor

> **new SecurityManager**(`webhookConfig`): `SecurityManager`

Defined in: [packages/webhook/src/security/security.manager.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L25)

#### Parameters

##### webhookConfig

`Pick`\<[`WebhookConfig`](/en/api/webhook/src/interfaces/webhookconfig/), `"algorithm"` \| `"signatureHeader"` \| `"signaturePrefix"`\>

#### Returns

`SecurityManager`

## Methods

### createSecurityHeaders()

> **createSecurityHeaders**(`payload`, `secret`): `Record`\<`string`, `string`\>

Defined in: [packages/webhook/src/security/security.manager.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L123)

Webhook 전송을 위한 보안 헤더 생성

#### Parameters

##### payload

`string`

##### secret

`string`

#### Returns

`Record`\<`string`, `string`\>

***

### createSignedPayload()

> **createSignedPayload**(`payload`, `timestamp`): `string`

Defined in: [packages/webhook/src/security/security.manager.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L42)

Canonical string to sign when a timestamp header is present.
Format: `${timestamp}.${payload}`

#### Parameters

##### payload

`string`

##### timestamp

`string`

#### Returns

`string`

***

### extractSignature()

> **extractSignature**(`headers`): `string` \| `null`

Defined in: [packages/webhook/src/security/security.manager.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L108)

HTTP 헤더에서 서명 추출

#### Parameters

##### headers

`Record`\<`string`, `string`\>

#### Returns

`string` \| `null`

***

### generateSignature()

> **generateSignature**(`payload`, `secret`): `string`

Defined in: [packages/webhook/src/security/security.manager.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L49)

Webhook 페이로드에 대한 서명 생성

#### Parameters

##### payload

`string`

##### secret

`string`

#### Returns

`string`

***

### generateSignatureWithTimestamp()

> **generateSignatureWithTimestamp**(`payload`, `timestamp`, `secret`): `string`

Defined in: [packages/webhook/src/security/security.manager.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L59)

Generate signature for a timestamped webhook.
(Recommended when also validating `X-Webhook-Timestamp` to prevent replay.)

#### Parameters

##### payload

`string`

##### timestamp

`string`

##### secret

`string`

#### Returns

`string`

***

### getConfig()

> **getConfig**(): `SecurityConfig`

Defined in: [packages/webhook/src/security/security.manager.ts:221](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L221)

현재 보안 설정 반환

#### Returns

`SecurityConfig`

***

### updateConfig()

> **updateConfig**(`config`): `void`

Defined in: [packages/webhook/src/security/security.manager.ts:214](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L214)

보안 설정 업데이트

#### Parameters

##### config

`Partial`\<`SecurityConfig`\>

#### Returns

`void`

***

### verifySignature()

> **verifySignature**(`payload`, `signature`, `secret`): `boolean`

Defined in: [packages/webhook/src/security/security.manager.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L73)

Webhook 서명 검증

#### Parameters

##### payload

`string`

##### signature

`string`

##### secret

`string`

#### Returns

`boolean`

***

### verifySignatureWithTimestamp()

> **verifySignatureWithTimestamp**(`payload`, `timestamp`, `signature`, `secret`): `boolean`

Defined in: [packages/webhook/src/security/security.manager.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L92)

Verify signature for a timestamped webhook.

#### Parameters

##### payload

`string`

##### timestamp

`string`

##### signature

`string`

##### secret

`string`

#### Returns

`boolean`

***

### verifyTimestamp()

> **verifyTimestamp**(`timestamp`, `toleranceSeconds?`): `boolean`

Defined in: [packages/webhook/src/security/security.manager.ts:145](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/security.manager.ts#L145)

타임스탬프 기반 재생 공격 방지 검증

#### Parameters

##### timestamp

`string`

##### toleranceSeconds?

`number` = `300`

#### Returns

`boolean`
