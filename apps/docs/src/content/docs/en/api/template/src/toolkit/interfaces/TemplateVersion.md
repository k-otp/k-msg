---
editUrl: false
next: false
prev: false
title: "TemplateVersion"
---

Defined in: [packages/template/src/registry/template.registry.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L40)

## Properties

### changes

> **changes**: `string`[]

Defined in: [packages/template/src/registry/template.registry.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L43)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/template/src/registry/template.registry.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L44)

***

### createdBy?

> `optional` **createdBy?**: `string`

Defined in: [packages/template/src/registry/template.registry.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L45)

***

### template

> **template**: `object`

Defined in: [packages/template/src/registry/template.registry.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L42)

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

### version

> **version**: `number`

Defined in: [packages/template/src/registry/template.registry.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L41)
