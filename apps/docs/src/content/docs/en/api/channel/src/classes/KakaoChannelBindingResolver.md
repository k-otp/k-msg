---
editUrl: false
next: false
prev: false
title: "KakaoChannelBindingResolver"
---

Defined in: packages/channel/src/runtime/kakao-channel-binding-resolver.ts:68

Runtime channel APIs

## Constructors

### Constructor

> **new KakaoChannelBindingResolver**(`config`): `KakaoChannelBindingResolver`

Defined in: packages/channel/src/runtime/kakao-channel-binding-resolver.ts:69

#### Parameters

##### config

[`KakaoChannelResolverConfig`](/api/channel/src/interfaces/kakaochannelresolverconfig/)

#### Returns

`KakaoChannelBindingResolver`

## Methods

### getAlias()

> **getAlias**(`alias`): [`KakaoChannelAliasEntry`](/api/channel/src/interfaces/kakaochannelaliasentry/) \| `undefined`

Defined in: packages/channel/src/runtime/kakao-channel-binding-resolver.ts:278

#### Parameters

##### alias

`string`

#### Returns

[`KakaoChannelAliasEntry`](/api/channel/src/interfaces/kakaochannelaliasentry/) \| `undefined`

***

### list()

> **list**(`params?`): [`KakaoChannelListItem`](/api/channel/src/interfaces/kakaochannellistitem/)[]

Defined in: packages/channel/src/runtime/kakao-channel-binding-resolver.ts:71

#### Parameters

##### params?

###### providerId?

`string`

#### Returns

[`KakaoChannelListItem`](/api/channel/src/interfaces/kakaochannellistitem/)[]

***

### resolve()

> **resolve**(`input?`): [`ResolvedKakaoChannelBinding`](/api/channel/src/interfaces/resolvedkakaochannelbinding/)

Defined in: packages/channel/src/runtime/kakao-channel-binding-resolver.ts:153

#### Parameters

##### input?

[`KakaoChannelResolveInput`](/api/channel/src/interfaces/kakaochannelresolveinput/)

#### Returns

[`ResolvedKakaoChannelBinding`](/api/channel/src/interfaces/resolvedkakaochannelbinding/)
