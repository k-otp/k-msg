---
editUrl: false
next: false
prev: false
title: "PermissionManager"
---

Defined in: [packages/channel/src/toolkit/management/permissions.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L101)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new PermissionManager**(): `PermissionManager`

Defined in: [packages/channel/src/toolkit/management/permissions.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L110)

#### Returns

`PermissionManager`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L16)

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

### assignRoleToUser()

> **assignRoleToUser**(`userId`, `roleId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:261](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L261)

#### Parameters

##### userId

`string`

##### roleId

`string`

#### Returns

`Promise`\<`void`\>

***

### checkPermission()

> **checkPermission**(`check`): `Promise`\<[`PermissionResult`](/api/channel/src/toolkit/interfaces/permissionresult/)\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:313](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L313)

#### Parameters

##### check

[`PermissionCheck`](/api/channel/src/toolkit/interfaces/permissioncheck/)

#### Returns

`Promise`\<[`PermissionResult`](/api/channel/src/toolkit/interfaces/permissionresult/)\>

***

### createRole()

> **createRole**(`roleData`): `Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:187](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L187)

#### Parameters

##### roleData

`Omit`\<[`Role`](/api/channel/src/toolkit/interfaces/role/), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)\>

***

### createUser()

> **createUser**(`userData`): `Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L116)

#### Parameters

##### userData

`Omit`\<[`User`](/api/channel/src/toolkit/interfaces/user/), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>

***

### deleteRole()

> **deleteRole**(`roleId`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:235](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L235)

#### Parameters

##### roleId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### deleteUser()

> **deleteUser**(`userId`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L172)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L44)

#### Parameters

##### eventName

`string`

##### args

...`any`[]

#### Returns

`boolean`

#### Inherited from

`EventEmitter.emit`

***

### eventNames()

> **eventNames**(): `string`[]

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L71)

#### Returns

`string`[]

#### Inherited from

`EventEmitter.eventNames`

***

### getRole()

> **getRole**(`roleId`): `Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/) \| `null`\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:205](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L205)

#### Parameters

##### roleId

`string`

#### Returns

`Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/) \| `null`\>

***

### getUser()

> **getUser**(`userId`): `Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/) \| `null`\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:138](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L138)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/) \| `null`\>

***

### getUserPermissions()

> **getUserPermissions**(`userId`): `Promise`\<[`Permission`](/api/channel/src/toolkit/interfaces/permission/)[]\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:368](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L368)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<[`Permission`](/api/channel/src/toolkit/interfaces/permission/)[]\>

***

### getUserRoles()

> **getUserRoles**(`userId`): `Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)[]\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:389](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L389)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)[]\>

***

### hasPermission()

> **hasPermission**(`userId`, `resource`, `action`, `resourceId?`, `context?`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:329](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L329)

#### Parameters

##### userId

`string`

##### resource

[`ResourceType`](/api/channel/src/toolkit/enumerations/resourcetype/)

##### action

[`ActionType`](/api/channel/src/toolkit/enumerations/actiontype/)

##### resourceId?

`string`

##### context?

[`AccessContext`](/api/channel/src/toolkit/interfaces/accesscontext/)

#### Returns

`Promise`\<`boolean`\>

***

### listenerCount()

> **listenerCount**(`eventName`): `number`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L67)

#### Parameters

##### eventName

`string`

#### Returns

`number`

#### Inherited from

`EventEmitter.listenerCount`

***

### listRoles()

> **listRoles**(): [`Role`](/api/channel/src/toolkit/interfaces/role/)[]

Defined in: [packages/channel/src/toolkit/management/permissions.ts:408](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L408)

#### Returns

[`Role`](/api/channel/src/toolkit/interfaces/role/)[]

***

### listUsers()

> **listUsers**(`filters?`): [`User`](/api/channel/src/toolkit/interfaces/user/)[]

Defined in: [packages/channel/src/toolkit/management/permissions.ts:394](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L394)

#### Parameters

##### filters?

###### isActive?

`boolean`

###### roleId?

`string`

#### Returns

[`User`](/api/channel/src/toolkit/interfaces/user/)[]

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L20)

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

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L9)

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

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L35)

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

### removeAllListeners()

> **removeAllListeners**(`eventName?`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L57)

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

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L31)

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

### removeRoleFromUser()

> **removeRoleFromUser**(`userId`, `roleId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:289](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L289)

#### Parameters

##### userId

`string`

##### roleId

`string`

#### Returns

`Promise`\<`void`\>

***

### requirePermission()

> **requirePermission**(`userId`, `resource`, `action`, `resourceId?`, `context?`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:347](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L347)

#### Parameters

##### userId

`string`

##### resource

[`ResourceType`](/api/channel/src/toolkit/enumerations/resourcetype/)

##### action

[`ActionType`](/api/channel/src/toolkit/enumerations/actiontype/)

##### resourceId?

`string`

##### context?

[`AccessContext`](/api/channel/src/toolkit/interfaces/accesscontext/)

#### Returns

`Promise`\<`void`\>

***

### updateRole()

> **updateRole**(`roleId`, `updates`): `Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:209](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L209)

#### Parameters

##### roleId

`string`

##### updates

`Partial`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)\>

#### Returns

`Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)\>

***

### updateUser()

> **updateUser**(`userId`, `updates`): `Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>

Defined in: [packages/channel/src/toolkit/management/permissions.ts:142](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/permissions.ts#L142)

#### Parameters

##### userId

`string`

##### updates

`Partial`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>

#### Returns

`Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>
