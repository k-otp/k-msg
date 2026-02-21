---
editUrl: false
next: false
prev: false
title: "KakaoChannelResolverConfig"
---

Defined in: packages/channel/src/runtime/types.ts:112

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

### aliases?

> `optional` **aliases**: `object`

Defined in: packages/channel/src/runtime/types.ts:126

#### Index Signature

\[`key`: `string`\]: `unknown`

#### kakaoChannels?

> `optional` **kakaoChannels**: `Record`\<`string`, [`KakaoChannelAliasEntry`](/api/channel/src/interfaces/kakaochannelaliasentry/)\>

***

### defaults?

> `optional` **defaults**: `object`

Defined in: packages/channel/src/runtime/types.ts:117

#### Index Signature

\[`key`: `string`\]: `unknown`

#### kakao?

> `optional` **kakao**: `object`

##### Index Signature

\[`key`: `string`\]: `unknown`

##### kakao.channel?

> `optional` **channel**: `string`

##### kakao.plusId?

> `optional` **plusId**: `string`

##### kakao.senderKey?

> `optional` **senderKey**: `string`

***

### providers?

> `optional` **providers**: [`KakaoProviderConfigEntry`](/api/channel/src/interfaces/kakaoproviderconfigentry/)[]

Defined in: packages/channel/src/runtime/types.ts:130

***

### routing?

> `optional` **routing**: `object`

Defined in: packages/channel/src/runtime/types.ts:113

#### Index Signature

\[`key`: `string`\]: `unknown`

#### defaultProviderId?

> `optional` **defaultProviderId**: `string`
