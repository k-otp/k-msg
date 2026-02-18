---
editUrl: false
next: false
prev: false
title: "RecommendationEngine"
---

Defined in: [packages/analytics/src/insights/recommendation.engine.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/recommendation.engine.ts#L85)

## Constructors

### Constructor

> **new RecommendationEngine**(`config?`): `RecommendationEngine`

Defined in: [packages/analytics/src/insights/recommendation.engine.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/recommendation.engine.ts#L123)

#### Parameters

##### config?

`Partial`\<[`RecommendationConfig`](/api/analytics/src/interfaces/recommendationconfig/)\> = `{}`

#### Returns

`RecommendationEngine`

## Methods

### dismissRecommendation()

> **dismissRecommendation**(`recommendationId`, `reason?`): `boolean`

Defined in: [packages/analytics/src/insights/recommendation.engine.ts:194](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/recommendation.engine.ts#L194)

추천 무시

#### Parameters

##### recommendationId

`string`

##### reason?

`string`

#### Returns

`boolean`

***

### generateRecommendations()

> **generateRecommendations**(`metrics`): `Promise`\<[`Recommendation`](/api/analytics/src/interfaces/recommendation/)[]\>

Defined in: [packages/analytics/src/insights/recommendation.engine.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/recommendation.engine.ts#L131)

메트릭 기반 추천 생성

#### Parameters

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

#### Returns

`Promise`\<[`Recommendation`](/api/analytics/src/interfaces/recommendation/)[]\>

***

### getRecommendationsByCategory()

> **getRecommendationsByCategory**(`category`): [`Recommendation`](/api/analytics/src/interfaces/recommendation/)[]

Defined in: [packages/analytics/src/insights/recommendation.engine.ts:173](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/recommendation.engine.ts#L173)

특정 카테고리 추천 조회

#### Parameters

##### category

`string`

#### Returns

[`Recommendation`](/api/analytics/src/interfaces/recommendation/)[]

***

### getRecommendationStats()

> **getRecommendationStats**(): `object`

Defined in: [packages/analytics/src/insights/recommendation.engine.ts:206](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/recommendation.engine.ts#L206)

추천 통계

#### Returns

`object`

##### byCategory

> **byCategory**: `Record`\<`string`, `number`\>

##### byImpact

> **byImpact**: `Record`\<`string`, `number`\>

##### byPriority

> **byPriority**: `Record`\<`string`, `number`\>

##### total

> **total**: `number`

***

### markRecommendationAsImplemented()

> **markRecommendationAsImplemented**(`recommendationId`): `boolean`

Defined in: [packages/analytics/src/insights/recommendation.engine.ts:182](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/recommendation.engine.ts#L182)

추천 실행 상태 업데이트

#### Parameters

##### recommendationId

`string`

#### Returns

`boolean`
