---
editUrl: false
next: false
prev: false
title: "KakaoChannelBindingResolver"
---

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L84)

Runtime channel APIs

## Constructors

### Constructor

> **new KakaoChannelBindingResolver**(`config`): `KakaoChannelBindingResolver`

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L85)

#### Parameters

##### config

[`KakaoChannelResolverConfig`](/en/api/channel/src/interfaces/kakaochannelresolverconfig/)

#### Returns

`KakaoChannelBindingResolver`

## Methods

### getAlias()

> **getAlias**(`alias`): [`KakaoChannelAliasEntry`](/en/api/channel/src/interfaces/kakaochannelaliasentry/) \| `undefined`

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:306](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L306)

#### Parameters

##### alias

`string`

#### Returns

[`KakaoChannelAliasEntry`](/en/api/channel/src/interfaces/kakaochannelaliasentry/) \| `undefined`

***

### list()

> **list**(`params?`): [`KakaoChannelListItem`](/en/api/channel/src/interfaces/kakaochannellistitem/)[]

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L87)

#### Parameters

##### params?

###### providerId?

`string`

#### Returns

[`KakaoChannelListItem`](/en/api/channel/src/interfaces/kakaochannellistitem/)[]

***

### resolve()

> **resolve**(`input?`): [`ResolvedKakaoChannelBinding`](/en/api/channel/src/interfaces/resolvedkakaochannelbinding/)

Defined in: [packages/channel/src/runtime/kakao-channel-binding-resolver.ts:171](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/runtime/kakao-channel-binding-resolver.ts#L171)

#### Parameters

##### input?

[`KakaoChannelResolveInput`](/en/api/channel/src/interfaces/kakaochannelresolveinput/)

#### Returns

[`ResolvedKakaoChannelBinding`](/en/api/channel/src/interfaces/resolvedkakaochannelbinding/)
