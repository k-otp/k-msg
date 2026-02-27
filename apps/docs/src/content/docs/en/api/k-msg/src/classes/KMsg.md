---
editUrl: false
next: false
prev: false
title: "KMsg"
---

Defined in: [packages/messaging/src/k-msg.ts:260](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L260)

High-level messaging facade for sending messages through configured providers.

KMsg provides a unified API for sending various message types (SMS, LMS, MMS,
ALIMTALK, FRIENDTALK, RCS, etc.) through multiple providers with automatic
routing, template interpolation, and lifecycle hooks.

Key features:
- Unified `send()` API for all message types
- Automatic provider routing based on message type
- Template variable interpolation with `#{variable}` syntax
- Lifecycle hooks for monitoring and tracking
- Batch sending with concurrency control
- Optional persistence strategies

## Examples

Basic usage with a single provider:
```ts
import { KMsg } from '@k-msg/messaging';
import { SolapiProvider } from '@k-msg/provider/solapi';

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: '01000000000',
    }),
  ],
});

// Send SMS (type is inferred when omitted)
const result = await kmsg.send({
  to: '01012345678',
  text: 'Hello, World!',
});

if (result.isSuccess) {
  console.log('Message sent:', result.value.messageId);
}
```

Multi-provider setup with routing:
```ts
import { KMsg } from '@k-msg/messaging';
import { IWINVProvider } from '@k-msg/provider';
import { SolapiProvider } from '@k-msg/provider/solapi';

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({ apiKey: '...', apiSecret: '...' }),
    new IWINVProvider({ apiKey: '...' }),
  ],
  routing: {
    defaultProviderId: 'solapi',
    byType: {
      ALIMTALK: 'iwinv',
    },
  },
});

// ALIMTALK will be routed to IWINV
await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'AUTH_OTP',
  variables: { code: '123456' },
});
```

## Constructors

### Constructor

> **new KMsg**(`config`): `KMsg`

Defined in: [packages/messaging/src/k-msg.ts:287](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L287)

Creates a new KMsg instance with the specified configuration.

#### Parameters

##### config

`KMsgConfig`

Configuration object containing providers and optional settings

#### Returns

`KMsg`

#### Throws

Error if config is invalid or providers array is empty

#### Example

```ts
const kmsg = new KMsg({
  providers: [new SolapiProvider({ apiKey: '...', apiSecret: '...' })],
  routing: { defaultProviderId: 'solapi' },
  defaults: { sms: { autoLmsBytes: 90 } },
});
```

## Methods

### healthCheck()

> **healthCheck**(): `Promise`\<\{ `healthy`: `boolean`; `issues`: `string`[]; `providers`: `Record`\<`string`, [`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>; \}\>

Defined in: [packages/messaging/src/k-msg.ts:384](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L384)

Performs a health check on all configured providers.

Checks the health status of each provider and aggregates the results.
Useful for monitoring and determining if the messaging system is operational.

#### Returns

`Promise`\<\{ `healthy`: `boolean`; `issues`: `string`[]; `providers`: `Record`\<`string`, [`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>; \}\>

A promise resolving to health check results containing:
  - `healthy`: `true` if all providers are healthy, `false` otherwise
  - `providers`: Map of provider IDs to their health status
  - `issues`: Array of error messages for any unhealthy providers

#### Example

```ts
const health = await kmsg.healthCheck();
if (!health.healthy) {
  console.error('Provider issues:', health.issues);
}
```

***

### send()

#### Call Signature

> **send**(`input`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/messaging/src/k-msg.ts:465](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L465)

Sends a single message and returns a Result.

This method normalizes the input, selects an appropriate provider based on
routing configuration, and sends the message. Template variables in the
message text are interpolated if `variables` are provided.

##### Parameters

###### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)

The message to send. Can be a single `SendInput` or an array.
  When `type` is omitted, the message is treated as SMS and may be upgraded
  to LMS based on content length and `defaults.sms.autoLmsBytes`.

##### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

A promise resolving to:
  - For single input: `Result<SendResult, KMsgError>`
  - For array input: `BatchSendResult` with individual results

##### Examples

Send an SMS:
```ts
const result = await kmsg.send({ to: '01012345678', text: 'Hello!' });
if (result.isSuccess) {
  console.log('Sent:', result.value.messageId);
} else {
  console.error('Failed:', result.error.message);
}
```

Send ALIMTALK with template variables:
```ts
const result = await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'AUTH_OTP',
  variables: { code: '123456', name: 'John' },
});
```

Send multiple messages (batch):
```ts
const batchResult = await kmsg.send([
  { to: '01011112222', text: 'Hello 1' },
  { to: '01033334444', text: 'Hello 2' },
]);
console.log(`Total: ${batchResult.total}, Results: ${batchResult.results.length}`);
```

#### Call Signature

> **send**(`input`): `Promise`\<[`BatchSendResult`](/api/messaging/src/interfaces/batchsendresult/)\>

Defined in: [packages/messaging/src/k-msg.ts:466](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L466)

Sends a single message and returns a Result.

This method normalizes the input, selects an appropriate provider based on
routing configuration, and sends the message. Template variables in the
message text are interpolated if `variables` are provided.

##### Parameters

###### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)[]

The message to send. Can be a single `SendInput` or an array.
  When `type` is omitted, the message is treated as SMS and may be upgraded
  to LMS based on content length and `defaults.sms.autoLmsBytes`.

##### Returns

`Promise`\<[`BatchSendResult`](/api/messaging/src/interfaces/batchsendresult/)\>

A promise resolving to:
  - For single input: `Result<SendResult, KMsgError>`
  - For array input: `BatchSendResult` with individual results

##### Examples

Send an SMS:
```ts
const result = await kmsg.send({ to: '01012345678', text: 'Hello!' });
if (result.isSuccess) {
  console.log('Sent:', result.value.messageId);
} else {
  console.error('Failed:', result.error.message);
}
```

Send ALIMTALK with template variables:
```ts
const result = await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'AUTH_OTP',
  variables: { code: '123456', name: 'John' },
});
```

Send multiple messages (batch):
```ts
const batchResult = await kmsg.send([
  { to: '01011112222', text: 'Hello 1' },
  { to: '01033334444', text: 'Hello 2' },
]);
console.log(`Total: ${batchResult.total}, Results: ${batchResult.results.length}`);
```

***

### sendOrThrow()

> **sendOrThrow**(`input`): `Promise`\<[`SendResult`](/api/core/src/interfaces/sendresult/)\>

Defined in: [packages/messaging/src/k-msg.ts:502](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L502)

Sends a single message and throws on failure.

This is a convenience method that unwraps the Result, returning the
`SendResult` on success or throwing the `KMsgError` on failure.
Useful when you want to use try/catch error handling instead of
checking `result.isSuccess`.

#### Parameters

##### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)

The message to send (single message only, not an array)

#### Returns

`Promise`\<[`SendResult`](/api/core/src/interfaces/sendresult/)\>

A promise resolving to `SendResult` on success

#### Throws

KMsgError if the message fails to send

#### Example

```ts
try {
  const result = await kmsg.sendOrThrow({
    to: '01012345678',
    text: 'Hello!',
  });
  console.log('Sent:', result.messageId);
} catch (error) {
  console.error('Send failed:', error.message);
}
```

***

### builder()

> `static` **builder**(): [`KMsgBuilder`](/api/messaging/src/classes/kmsgbuilder/)

Defined in: [packages/messaging/src/k-msg.ts:361](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L361)

Creates a new fluent builder for constructing KMsg instances.

The builder provides a chainable API for configuring providers,
routing, defaults, and hooks.

#### Returns

[`KMsgBuilder`](/api/messaging/src/classes/kmsgbuilder/)

A new KMsgBuilder instance

#### Example

```ts
const kmsg = KMsg.builder()
  .addProvider(new SolapiProvider({ apiKey: '...', apiSecret: '...' }))
  .withRouting({ defaultProviderId: 'solapi' })
  .withDefaults({ sms: { autoLmsBytes: 90 } })
  .build();
```

***

### create()

> `static` **create**(`config`): `KMsg`

Defined in: [packages/messaging/src/k-msg.ts:340](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L340)

Creates a KMsg instance with the specified configuration.

This is a factory method alias for the constructor, useful for
functional-style code or when you prefer named factory methods.

#### Parameters

##### config

`KMsgConfig`

Configuration object containing providers and optional settings

#### Returns

`KMsg`

A new KMsg instance

#### Example

```ts
import { KMsg } from '@k-msg/messaging';
import { SolapiProvider } from '@k-msg/provider/solapi';

const kmsg = KMsg.create({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: '01000000000',
    }),
  ],
  routing: { defaultProviderId: 'solapi' },
});
```
