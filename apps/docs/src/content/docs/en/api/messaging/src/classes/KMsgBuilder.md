---
editUrl: false
next: false
prev: false
title: "KMsgBuilder"
---

Defined in: [packages/messaging/src/k-msg.ts:1385](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L1385)

Fluent builder for creating KMsg instances.

Provides a chainable API for configuring providers, routing, defaults, and hooks.
Call `build()` to create the final KMsg instance.

## Example

```ts
const kmsg = KMsg.builder()
  .addProvider(new SolapiProvider({ apiKey: '...', apiSecret: '...' }))
  .addProvider(new IWINVProvider({ apiKey: '...' }))
  .withRouting({ defaultProviderId: 'solapi', byType: { ALIMTALK: 'iwinv' } })
  .withDefaults({ sms: { autoLmsBytes: 90 } })
  .withHooks({ onSuccess: (ctx, result) => console.log('Sent:', result.messageId) })
  .build();
```

## Constructors

### Constructor

> **new KMsgBuilder**(): `KMsgBuilder`

#### Returns

`KMsgBuilder`

## Methods

### addProvider()

> **addProvider**(`provider`): `this`

Defined in: [packages/messaging/src/k-msg.ts:1400](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L1400)

Adds a single provider to the builder.

#### Parameters

##### provider

[`Provider`](/api/core/src/interfaces/provider/)

The provider instance to add

#### Returns

`this`

this builder for method chaining

#### Example

```ts
builder.addProvider(new SolapiProvider({ apiKey: '...', apiSecret: '...' }))
```

***

### addProviders()

> **addProviders**(...`providers`): `this`

Defined in: [packages/messaging/src/k-msg.ts:1419](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L1419)

Adds multiple providers to the builder.

#### Parameters

##### providers

...[`Provider`](/api/core/src/interfaces/provider/)[]

The provider instances to add

#### Returns

`this`

this builder for method chaining

#### Example

```ts
builder.addProviders(
  new SolapiProvider({ apiKey: '...', apiSecret: '...' }),
  new IWINVProvider({ apiKey: '...' })
)
```

***

### build()

> **build**(): [`KMsg`](/api/k-msg/src/classes/kmsg/)

Defined in: [packages/messaging/src/k-msg.ts:1506](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L1506)

Builds and returns a new KMsg instance with the configured settings.

#### Returns

[`KMsg`](/api/k-msg/src/classes/kmsg/)

A new KMsg instance

#### Throws

Error if no providers have been added

#### Example

```ts
const kmsg = KMsg.builder()
  .addProvider(new SolapiProvider({ apiKey: '...' }))
  .build();
```

***

### withDefaults()

> **withDefaults**(`defaults`): `this`

Defined in: [packages/messaging/src/k-msg.ts:1458](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L1458)

Sets the defaults configuration.

#### Parameters

##### defaults

`KMsgDefaultsConfig`

Default values applied to outgoing messages

#### Returns

`this`

this builder for method chaining

#### Example

```ts
builder.withDefaults({
  sms: { autoLmsBytes: 90 },
  kakao: { profileId: 'my-profile' }
})
```

***

### withHooks()

> **withHooks**(`hooks`): `this`

Defined in: [packages/messaging/src/k-msg.ts:1477](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L1477)

Sets the lifecycle hooks.

#### Parameters

##### hooks

[`KMsgHooks`](/api/messaging/src/interfaces/kmsghooks/)

Hook functions for send lifecycle events

#### Returns

`this`

this builder for method chaining

#### Example

```ts
builder.withHooks({
  onSuccess: (ctx, result) => console.log('Sent:', result.messageId),
  onError: (ctx, error) => console.error('Failed:', error.message)
})
```

***

### withPersistence()

> **withPersistence**(`persistence`): `this`

Defined in: [packages/messaging/src/k-msg.ts:1488](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L1488)

Sets the persistence configuration.

#### Parameters

##### persistence

Persistence strategy and repository

\{ `repo`: [`MessageRepository`](/api/core/src/interfaces/messagerepository/); `strategy`: [`PersistenceStrategy`](/api/core/src/type-aliases/persistencestrategy/); \} | `undefined`

#### Returns

`this`

this builder for method chaining

***

### withRouting()

> **withRouting**(`routing`): `this`

Defined in: [packages/messaging/src/k-msg.ts:1439](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L1439)

Sets the routing configuration.

#### Parameters

##### routing

`KMsgRoutingConfig`

Routing configuration for provider selection

#### Returns

`this`

this builder for method chaining

#### Example

```ts
builder.withRouting({
  defaultProviderId: 'solapi',
  byType: { ALIMTALK: 'iwinv' },
  strategy: 'round_robin'
})
```
