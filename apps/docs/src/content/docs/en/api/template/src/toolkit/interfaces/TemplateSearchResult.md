---
editUrl: false
next: false
prev: false
title: "TemplateSearchResult"
---

Defined in: [packages/template/src/registry/template.registry.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L32)

## Properties

### hasMore

> **hasMore**: `boolean`

Defined in: [packages/template/src/registry/template.registry.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L37)

***

### limit

> **limit**: `number`

Defined in: [packages/template/src/registry/template.registry.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L36)

***

### page

> **page**: `number`

Defined in: [packages/template/src/registry/template.registry.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L35)

***

### templates

> **templates**: `object`[]

Defined in: [packages/template/src/registry/template.registry.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L33)

#### buttons?

> `optional` **buttons?**: `object`[]

#### category

> **category**: [`TemplateCategory`](/en/api/template/src/enumerations/templatecategory/)

#### code

> **code**: `string`

#### content

> **content**: `string`

#### id

> **id**: `string`

#### metadata

> **metadata**: `object` = `TemplateMetadataSchema`

##### metadata.approvedAt?

> `optional` **approvedAt?**: `Date`

##### metadata.createdAt

> **createdAt**: `Date`

##### metadata.rejectedAt?

> `optional` **rejectedAt?**: `Date`

##### metadata.rejectionReason?

> `optional` **rejectionReason?**: `string`

##### metadata.updatedAt

> **updatedAt**: `Date`

##### metadata.usage

> **usage**: `object` = `TemplateUsageStatsSchema`

##### metadata.usage.delivered

> **delivered**: `number`

##### metadata.usage.failed

> **failed**: `number`

##### metadata.usage.sent

> **sent**: `number`

#### name

> **name**: `string`

#### provider

> **provider**: `string`

#### status

> **status**: [`TemplateStatus`](/en/api/template/src/enumerations/templatestatus/)

#### variables?

> `optional` **variables?**: `object`[]

***

### total

> **total**: `number`

Defined in: [packages/template/src/registry/template.registry.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L34)
