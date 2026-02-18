---
editUrl: false
next: false
prev: false
title: "EventProcessor"
---

Defined in: [packages/analytics/src/collectors/event.collector.ts:34](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L34)

## Methods

### canProcess()

> **canProcess**(`event`): `boolean`

Defined in: [packages/analytics/src/collectors/event.collector.ts:35](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L35)

#### Parameters

##### event

[`EventData`](/api/analytics/src/interfaces/eventdata/)

#### Returns

`boolean`

***

### process()

> **process**(`event`): `Promise`\<[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]\>

Defined in: [packages/analytics/src/collectors/event.collector.ts:36](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L36)

#### Parameters

##### event

[`EventData`](/api/analytics/src/interfaces/eventdata/)

#### Returns

`Promise`\<[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]\>
