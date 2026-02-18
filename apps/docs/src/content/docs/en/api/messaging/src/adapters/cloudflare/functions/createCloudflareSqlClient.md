---
editUrl: false
next: false
prev: false
title: "createCloudflareSqlClient"
---

> **createCloudflareSqlClient**(`options`): [`CloudflareSqlClient`](/api/messaging/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L32)

## Parameters

### options

#### close?

() => `void` \| `Promise`\<`void`\>

#### dialect

[`SqlDialect`](/api/messaging/src/adapters/cloudflare/type-aliases/sqldialect/)

#### query

\<`T`\>(`sql`, `params?`) => `Promise`\<[`CloudflareSqlQueryResult`](/api/messaging/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>\>

#### transaction?

\<`T`\>(`fn`) => `Promise`\<`T`\>

## Returns

[`CloudflareSqlClient`](/api/messaging/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)
