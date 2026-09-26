---
editUrl: false
next: false
prev: false
title: "KMsgRoutingConfig"
---

Defined in: [packages/messaging/src/k-msg.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L76)

Configuration for routing messages to specific providers.

Controls how KMsg selects which provider to use for each message type.
Routing is resolved in this order: explicit `providerId` > `byType` mapping >
`defaultProviderId` > first provider that supports the message type.

## Example

```ts
const routing: KMsgRoutingConfig = {
  defaultProviderId: 'solapi',
  byType: {
    ALIMTALK: 'iwinv',
    SMS: ['solapi', 'iwinv'],
  },
  strategy: 'round_robin',
};
```

## Properties

### byType?

> `optional` **byType?**: `Partial`\<`Record`\<[`MessageType`](/en/api/core/src/type-aliases/messagetype/), `string` \| `string`[]\>\>

Defined in: [packages/messaging/src/k-msg.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L82)

Map of message types to provider IDs.
Can be a single provider ID or an array for load balancing.
When an array is provided, the `strategy` determines which provider is selected.

***

### defaultProviderId?

> `optional` **defaultProviderId?**: `string`

Defined in: [packages/messaging/src/k-msg.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L88)

Default provider ID to use when no type-specific routing is configured
and no explicit `providerId` is provided in the send options.

***

### strategy?

> `optional` **strategy?**: [`RoutingStrategy`](/en/api/messaging/src/type-aliases/routingstrategy/)

Defined in: [packages/messaging/src/k-msg.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L94)

Strategy for selecting from multiple providers when `byType` contains an array.

#### Default

```ts
"first"
```
