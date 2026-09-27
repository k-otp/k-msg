---
editUrl: false
next: false
prev: false
title: "AligoProvider"
---

Defined in: [packages/provider/src/aligo/provider.send.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L42)

Aligo send/channel focused entrypoint.

## Extended by

- [`AligoProvider`](/en/api/provider/src/aligo/classes/aligoprovider/)

## Implements

- [`Provider`](/en/api/core/src/interfaces/provider/)
- [`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/)

## Constructors

### Constructor

> **new AligoProvider**(`config`): `AligoSendProvider`

Defined in: [packages/provider/src/aligo/provider.send.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L71)

#### Parameters

##### config

[`AligoConfig`](/en/api/provider/src/aligo/interfaces/aligoconfig/)

#### Returns

`AligoSendProvider`

## Properties

### id

> `readonly` **id**: `"aligo"` = `"aligo"`

Defined in: [packages/provider/src/aligo/provider.send.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L43)

Unique identifier for this provider instance.
Used for routing and logging.

#### Example

```ts
"solapi"
```

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`id`](/en/api/core/src/interfaces/provider/#id)

***

### name

> `readonly` **name**: `"Aligo Smart SMS"` = `"Aligo Smart SMS"`

Defined in: [packages/provider/src/aligo/provider.send.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L44)

Human-readable name for display purposes.

#### Example

```ts
"SOLAPI"
```

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`name`](/en/api/core/src/interfaces/provider/#name)

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/en/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/provider/src/aligo/provider.send.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L45)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`supportedTypes`](/en/api/core/src/interfaces/provider/#supportedtypes)

***

### transportCapabilities

> `readonly` **transportCapabilities**: `object`

Defined in: [packages/provider/src/aligo/provider.send.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L52)

Per-operation transport features supported by this provider.
Missing declarations must be treated as unsupported.

#### abortSignal

> `readonly` **abortSignal**: `"supported"` = `"supported"`

#### injectableFetch

> `readonly` **injectableFetch**: `"supported"` = `"supported"`

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`transportCapabilities`](/en/api/core/src/interfaces/provider/#transportcapabilities)

## Methods

### addKakaoChannel()

> **addKakaoChannel**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:178](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L178)

Add a Kakao channel after authentication.

#### Parameters

##### params

###### authNum

`string`

###### categoryCode

`string`

###### phoneNumber

`string`

###### plusId

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`addKakaoChannel`](/en/api/core/src/interfaces/kakaochannelprovider/#addkakaochannel)

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/aligo/provider.send.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L63)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/en/api/core/src/interfaces/provider/#getonboardingspec)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/provider/src/aligo/provider.send.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L110)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`healthCheck`](/en/api/core/src/interfaces/provider/#healthcheck)

***

### listKakaoChannelCategories()

> **listKakaoChannelCategories**(): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:165](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L165)

List available channel categories for registration.

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelprovider/#listkakaochannelcategories)

***

### listKakaoChannels()

> **listKakaoChannels**(`params?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:158](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L158)

List registered Kakao channels.

#### Parameters

##### params?

###### plusId?

`string`

###### senderKey?

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannels`](/en/api/core/src/interfaces/kakaochannelprovider/#listkakaochannels)

***

### requestKakaoChannelAuth()

> **requestKakaoChannelAuth**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:171](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L171)

Request authentication SMS for channel registration.

#### Parameters

##### params

###### phoneNumber

`string`

###### plusId

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`requestKakaoChannelAuth`](/en/api/core/src/interfaces/kakaochannelprovider/#requestkakaochannelauth)

***

### send()

> **send**(`options`, `context?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:149](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L149)

Send a message through this provider.

#### Parameters

##### options

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)

##### context?

[`ProviderRequestContext`](/en/api/core/src/interfaces/providerrequestcontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`send`](/en/api/core/src/interfaces/provider/#send)
