---
editUrl: false
next: false
prev: false
title: "createCloudflareSqlClient"
---

> **createCloudflareSqlClient**(`options`): [`CloudflareSqlClient`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:140](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L140)

## Parameters

### options

#### close?

() => `void` \| `Promise`\<`void`\>

#### dialect

[`SqlDialect`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

#### query

\<`T`\>(`sql`, `params?`) => `Promise`\<[`CloudflareSqlQueryResult`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>\>

#### transaction?

\<`T`\>(`fn`) => `Promise`\<`T`\>

## Returns

[`CloudflareSqlClient`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)
