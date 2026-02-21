---
editUrl: false
next: false
prev: false
title: "KakaoChannelBindingResolver"
---

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L70)

Runtime channel APIs

## Constructors

### Constructor

> **new KakaoChannelBindingResolver**(`config`): `KakaoChannelBindingResolver`

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L71)

#### Parameters

##### config

[`KakaoChannelResolverConfig`](/api/channel/src/interfaces/kakaochannelresolverconfig/)

#### Returns

`KakaoChannelBindingResolver`

## Methods

### getAlias()

> **getAlias**(`alias`): [`KakaoChannelAliasEntry`](/api/channel/src/interfaces/kakaochannelaliasentry/) \| `undefined`

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:282](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L282)

#### Parameters

##### alias

`string`

#### Returns

[`KakaoChannelAliasEntry`](/api/channel/src/interfaces/kakaochannelaliasentry/) \| `undefined`

***

### list()

> **list**(`params?`): [`KakaoChannelListItem`](/api/channel/src/interfaces/kakaochannellistitem/)[]

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L73)

#### Parameters

##### params?

###### providerId?

`string`

#### Returns

[`KakaoChannelListItem`](/api/channel/src/interfaces/kakaochannellistitem/)[]

***

### resolve()

> **resolve**(`input?`): [`ResolvedKakaoChannelBinding`](/api/channel/src/interfaces/resolvedkakaochannelbinding/)

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:157](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L157)

#### Parameters

##### input?

[`KakaoChannelResolveInput`](/api/channel/src/interfaces/kakaochannelresolveinput/)

#### Returns

[`ResolvedKakaoChannelBinding`](/api/channel/src/interfaces/resolvedkakaochannelbinding/)
