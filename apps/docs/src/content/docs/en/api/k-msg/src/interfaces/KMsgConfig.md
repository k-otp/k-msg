---
editUrl: false
next: false
prev: false
title: "KMsgConfig"
---

Defined in: [packages/messaging/src/k-msg.ts:155](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L155)

Configuration object for initializing a KMsg instance.

## Example

```ts
const config: KMsgConfig = {
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: '01000000000',
    }),
  ],
  routing: {
    defaultProviderId: 'solapi',
  },
  defaults: {
    sms: { autoLmsBytes: 90 },
  },
};
```

## Properties

### defaults?

> `optional` **defaults?**: [`KMsgDefaultsConfig`](/en/api/k-msg/src/interfaces/kmsgdefaultsconfig/)

Defined in: [packages/messaging/src/k-msg.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L170)

Optional defaults applied to outgoing messages.

***

### hooks?

> `optional` **hooks?**: [`KMsgHooks`](/en/api/messaging/src/interfaces/kmsghooks/)

Defined in: [packages/messaging/src/k-msg.ts:176](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L176)

Optional lifecycle hooks for send operations.
Hooks are called at various stages: before send, on success, on error, and on completion.

***

### persistence?

> `optional` **persistence?**: `object`

Defined in: [packages/messaging/src/k-msg.ts:185](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L185)

Optional persistence configuration for message storage.
- `none`: No persistence (default)
- `log`: Fire-and-forget async logging
- `queue`: Queue for async processing
- `full`: Full persistence with status updates

#### repo

> **repo**: [`MessageRepository`](/en/api/core/src/interfaces/messagerepository/)

#### strategy

> **strategy**: [`PersistenceStrategy`](/en/api/core/src/type-aliases/persistencestrategy/)

***

### providers

> **providers**: [`Provider`](/en/api/core/src/interfaces/provider/)[]

Defined in: [packages/messaging/src/k-msg.ts:160](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L160)

Array of provider instances to use for sending messages.
At least one provider is required.

***

### routing?

> `optional` **routing?**: [`KMsgRoutingConfig`](/en/api/k-msg/src/interfaces/kmsgroutingconfig/)

Defined in: [packages/messaging/src/k-msg.ts:165](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L165)

Optional routing configuration for provider selection.
