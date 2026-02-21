---
editUrl: false
next: false
prev: false
title: "TemplateRegistry"
---

Defined in: [packages/template/src/registry/template.registry.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L79)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new TemplateRegistry**(`options?`): `TemplateRegistry`

Defined in: [packages/template/src/registry/template.registry.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L99)

#### Parameters

##### options?

`Partial`\<[`TemplateRegistryOptions`](/api/template/src/toolkit/interfaces/templateregistryoptions/)\> = `{}`

#### Returns

`TemplateRegistry`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/template/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/template/src/shared/event-emitter.ts#L16)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.addListener`

***

### clear()

> **clear**(): `void`

Defined in: [packages/template/src/registry/template.registry.ts:596](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L596)

Clear all templates (use with caution!)

#### Returns

`void`

***

### delete()

> **delete**(`templateId`): `Promise`\<`boolean`\>

Defined in: [packages/template/src/registry/template.registry.ts:362](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L362)

Delete template

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/template/src/registry/template.registry.ts:610](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L610)

Stop the registry and cleanup

#### Returns

`void`

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/template/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/template/src/shared/event-emitter.ts#L44)

#### Parameters

##### eventName

`string`

##### args

...`unknown`[]

#### Returns

`boolean`

#### Inherited from

`EventEmitter.emit`

***

### export()

> **export**(`filters?`): `string`

Defined in: [packages/template/src/registry/template.registry.ts:537](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L537)

Export templates to JSON

#### Parameters

##### filters?

[`TemplateSearchFilters`](/api/template/src/toolkit/interfaces/templatesearchfilters/)

#### Returns

`string`

***

### get()

> **get**(`templateId`): [`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`

Defined in: [packages/template/src/registry/template.registry.ts:208](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L208)

Get template by ID

#### Parameters

##### templateId

`string`

#### Returns

[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`

***

### getByCategory()

> **getByCategory**(`category`): [`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)[]

Defined in: [packages/template/src/registry/template.registry.ts:350](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L350)

Get templates by category

#### Parameters

##### category

[`TemplateCategory`](/api/template/src/enumerations/templatecategory/)

#### Returns

[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)[]

***

### getByCode()

> **getByCode**(`code`, `provider`): [`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`

Defined in: [packages/template/src/registry/template.registry.ts:215](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L215)

Get template by code and provider

#### Parameters

##### code

`string`

##### provider

`string`

#### Returns

[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`

***

### getByProvider()

> **getByProvider**(`provider`): [`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)[]

Defined in: [packages/template/src/registry/template.registry.ts:338](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L338)

Get templates by provider

#### Parameters

##### provider

`string`

#### Returns

[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)[]

***

### getHistory()

> **getHistory**(`templateId`): [`TemplateHistory`](/api/template/src/toolkit/interfaces/templatehistory/) \| `null`

Defined in: [packages/template/src/registry/template.registry.ts:399](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L399)

Get template version history

#### Parameters

##### templateId

`string`

#### Returns

[`TemplateHistory`](/api/template/src/toolkit/interfaces/templatehistory/) \| `null`

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/template/src/registry/template.registry.ts:508](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L508)

Get registry statistics

#### Returns

`object`

##### byCategory

> **byCategory**: `Record`\<`string`, `number`\>

##### byProvider

> **byProvider**: `Record`\<`string`, `number`\>

##### byStatus

> **byStatus**: `Record`\<`string`, `number`\>

##### totalTemplates

> **totalTemplates**: `number`

***

### getUsageStats()

> **getUsageStats**(`templateId`): [`TemplateUsageStats`](/api/template/src/toolkit/interfaces/templateusagestats/) \| `null`

Defined in: [packages/template/src/registry/template.registry.ts:441](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L441)

Get template usage statistics

#### Parameters

##### templateId

`string`

#### Returns

[`TemplateUsageStats`](/api/template/src/toolkit/interfaces/templateusagestats/) \| `null`

***

### getVersion()

> **getVersion**(`templateId`, `version`): [`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`

Defined in: [packages/template/src/registry/template.registry.ts:406](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L406)

Get specific template version

#### Parameters

##### templateId

`string`

##### version

`number`

#### Returns

[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`

***

### import()

> **import**(`jsonData`, `options?`): `Promise`\<\{ `errors`: `string`[]; `imported`: `number`; `skipped`: `number`; \}\>

Defined in: [packages/template/src/registry/template.registry.ts:553](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L553)

Import templates from JSON

#### Parameters

##### jsonData

`string`

##### options?

###### overwrite?

`boolean`

#### Returns

`Promise`\<\{ `errors`: `string`[]; `imported`: `number`; `skipped`: `number`; \}\>

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/template/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/template/src/shared/event-emitter.ts#L20)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.off`

***

### on()

> **on**(`eventName`, `listener`): `this`

Defined in: [packages/template/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/template/src/shared/event-emitter.ts#L9)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.on`

***

### once()

> **once**(`eventName`, `listener`): `this`

Defined in: [packages/template/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/template/src/shared/event-emitter.ts#L35)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.once`

***

### register()

> **register**(`template`): `Promise`\<`void`\>

Defined in: [packages/template/src/registry/template.registry.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L111)

Register a new template

#### Parameters

##### template

[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)

#### Returns

`Promise`\<`void`\>

***

### removeAllListeners()

> **removeAllListeners**(`eventName?`): `this`

Defined in: [packages/template/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/template/src/shared/event-emitter.ts#L57)

#### Parameters

##### eventName?

`string`

#### Returns

`this`

#### Inherited from

`EventEmitter.removeAllListeners`

***

### removeListener()

> **removeListener**(`eventName`, `listener`): `this`

Defined in: [packages/template/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/template/src/shared/event-emitter.ts#L31)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.removeListener`

***

### restoreVersion()

> **restoreVersion**(`templateId`, `version`): `Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

Defined in: [packages/template/src/registry/template.registry.ts:417](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L417)

Restore template to a specific version

#### Parameters

##### templateId

`string`

##### version

`number`

#### Returns

`Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

***

### search()

> **search**(`filters?`, `options?`): [`TemplateSearchResult`](/api/template/src/toolkit/interfaces/templatesearchresult/)

Defined in: [packages/template/src/registry/template.registry.ts:222](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L222)

Search templates with filters and pagination

#### Parameters

##### filters?

[`TemplateSearchFilters`](/api/template/src/toolkit/interfaces/templatesearchfilters/) = `{}`

##### options?

[`TemplateSearchOptions`](/api/template/src/toolkit/interfaces/templatesearchoptions/) = `{}`

#### Returns

[`TemplateSearchResult`](/api/template/src/toolkit/interfaces/templatesearchresult/)

***

### update()

> **update**(`templateId`, `updates`): `Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

Defined in: [packages/template/src/registry/template.registry.ts:153](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L153)

Update an existing template

#### Parameters

##### templateId

`string`

##### updates

`Partial`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

#### Returns

`Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

***

### updateUsageStats()

> **updateUsageStats**(`templateId`, `stats`): `void`

Defined in: [packages/template/src/registry/template.registry.ts:448](https://github.com/k-otp/k-msg/blob/main/packages/template/src/registry/template.registry.ts#L448)

Update template usage statistics

#### Parameters

##### templateId

`string`

##### stats

###### delivered?

`number`

###### failed?

`number`

###### sent?

`number`

#### Returns

`void`
