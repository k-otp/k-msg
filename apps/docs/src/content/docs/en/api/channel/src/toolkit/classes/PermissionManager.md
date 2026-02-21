---
editUrl: false
next: false
prev: false
title: "PermissionManager"
---

Defined in: packages/channel/src/toolkit/management/permissions.ts:101

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new PermissionManager**(): `PermissionManager`

Defined in: packages/channel/src/toolkit/management/permissions.ts:110

#### Returns

`PermissionManager`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:16

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

Defined in: packages/channel/src/toolkit/management/permissions.ts:261

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

Defined in: packages/channel/src/toolkit/management/permissions.ts:313

#### Parameters

##### check

[`PermissionCheck`](/api/channel/src/toolkit/interfaces/permissioncheck/)

#### Returns

`Promise`\<[`PermissionResult`](/api/channel/src/toolkit/interfaces/permissionresult/)\>

***

### createRole()

> **createRole**(`roleData`): `Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:187

#### Parameters

##### roleData

`Omit`\<[`Role`](/api/channel/src/toolkit/interfaces/role/), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)\>

***

### createUser()

> **createUser**(`userData`): `Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:116

#### Parameters

##### userData

`Omit`\<[`User`](/api/channel/src/toolkit/interfaces/user/), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>

***

### deleteRole()

> **deleteRole**(`roleId`): `Promise`\<`boolean`\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:235

#### Parameters

##### roleId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### deleteUser()

> **deleteUser**(`userId`): `Promise`\<`boolean`\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:172

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:44

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

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:71

#### Returns

`string`[]

#### Inherited from

`EventEmitter.eventNames`

***

### getRole()

> **getRole**(`roleId`): `Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/) \| `null`\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:205

#### Parameters

##### roleId

`string`

#### Returns

`Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/) \| `null`\>

***

### getUser()

> **getUser**(`userId`): `Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/) \| `null`\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:138

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/) \| `null`\>

***

### getUserPermissions()

> **getUserPermissions**(`userId`): `Promise`\<[`Permission`](/api/channel/src/toolkit/interfaces/permission/)[]\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:368

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<[`Permission`](/api/channel/src/toolkit/interfaces/permission/)[]\>

***

### getUserRoles()

> **getUserRoles**(`userId`): `Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)[]\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:389

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<[`Role`](/api/channel/src/toolkit/interfaces/role/)[]\>

***

### hasPermission()

> **hasPermission**(`userId`, `resource`, `action`, `resourceId?`, `context?`): `Promise`\<`boolean`\>

Defined in: packages/channel/src/toolkit/management/permissions.ts:329

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

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:67

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

Defined in: packages/channel/src/toolkit/management/permissions.ts:408

#### Returns

[`Role`](/api/channel/src/toolkit/interfaces/role/)[]

***

### listUsers()

> **listUsers**(`filters?`): [`User`](/api/channel/src/toolkit/interfaces/user/)[]

Defined in: packages/channel/src/toolkit/management/permissions.ts:394

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

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:20

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

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:9

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

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:35

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

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:57

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

Defined in: packages/channel/src/toolkit/shared/event-emitter.ts:31

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

Defined in: packages/channel/src/toolkit/management/permissions.ts:289

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

Defined in: packages/channel/src/toolkit/management/permissions.ts:347

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

Defined in: packages/channel/src/toolkit/management/permissions.ts:209

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

Defined in: packages/channel/src/toolkit/management/permissions.ts:142

#### Parameters

##### userId

`string`

##### updates

`Partial`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>

#### Returns

`Promise`\<[`User`](/api/channel/src/toolkit/interfaces/user/)\>
