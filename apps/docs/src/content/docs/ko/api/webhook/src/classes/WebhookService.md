---
editUrl: false
next: false
prev: false
title: "WebhookService"
---

Defined in: [packages/webhook/src/services/webhook.service.ts:14](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L14)

## Constructors

### Constructor

> **new WebhookService**(`config`, `httpClient?`): `WebhookService`

Defined in: [packages/webhook/src/services/webhook.service.ts:21](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L21)

#### Parameters

##### config

[`WebhookConfig`](/api/webhook/src/interfaces/webhookconfig/)

##### httpClient?

[`HttpClient`](/api/webhook/src/interfaces/httpclient/)

#### Returns

`WebhookService`

## Methods

### deleteEndpoint()

> **deleteEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.service.ts:87](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L87)

웹훅 엔드포인트 삭제

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**(`event`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.service.ts:108](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L108)

이벤트 발생 (비동기 처리)

#### Parameters

##### event

[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<`void`\>

***

### emitSync()

> **emitSync**(`event`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/services/webhook.service.ts:129](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L129)

이벤트 발생 (동기 처리)

#### Parameters

##### event

[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### getDeliveries()

> **getDeliveries**(`endpointId?`, `eventType?`, `status?`, `limit?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/services/webhook.service.ts:324](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L324)

웹훅 전달 내역 조회

#### Parameters

##### endpointId?

`string`

##### eventType?

[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)

##### status?

`string`

##### limit?

`number` = `100`

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: [packages/webhook/src/services/webhook.service.ts:94](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L94)

웹훅 엔드포인트 조회

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### getStats()

> **getStats**(`endpointId`, `timeRange`): `Promise`\<[`WebhookStats`](/api/webhook/src/interfaces/webhookstats/)\>

Defined in: [packages/webhook/src/services/webhook.service.ts:199](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L199)

웹훅 통계 조회

#### Parameters

##### endpointId

`string`

##### timeRange

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<[`WebhookStats`](/api/webhook/src/interfaces/webhookstats/)\>

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: [packages/webhook/src/services/webhook.service.ts:101](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L101)

모든 웹훅 엔드포인트 조회

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### pauseEndpoint()

> **pauseEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.service.ts:310](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L310)

웹훅 일시 중단

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### registerEndpoint()

> **registerEndpoint**(`endpoint`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/services/webhook.service.ts:32](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L32)

웹훅 엔드포인트 등록

#### Parameters

##### endpoint

`Omit`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/), `"id"` \| `"createdAt"` \| `"updatedAt"` \| `"status"`\>

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

***

### resumeEndpoint()

> **resumeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.service.ts:317](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L317)

웹훅 재개

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### retryFailed()

> **retryFailed**(`endpointId?`, `eventType?`): `Promise`\<`number`\>

Defined in: [packages/webhook/src/services/webhook.service.ts:256](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L256)

실패한 웹훅 재시도

#### Parameters

##### endpointId?

`string`

##### eventType?

[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)

#### Returns

`Promise`\<`number`\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.service.ts:504](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L504)

서비스 종료 시 정리

#### Returns

`Promise`\<`void`\>

***

### testEndpoint()

> **testEndpoint**(`endpointId`): `Promise`\<[`WebhookTestResult`](/api/webhook/src/interfaces/webhooktestresult/)\>

Defined in: [packages/webhook/src/services/webhook.service.ts:147](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L147)

웹훅 엔드포인트 테스트

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookTestResult`](/api/webhook/src/interfaces/webhooktestresult/)\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/services/webhook.service.ts:60](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.service.ts#L60)

웹훅 엔드포인트 수정

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>
