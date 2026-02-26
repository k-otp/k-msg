---
editUrl: false
next: false
prev: false
title: "BalanceProvider"
---

Defined in: [packages/core/src/provider.ts:181](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L181)

Interface for providers that support balance queries.

## Methods

### getBalance()

> **getBalance**(`query?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`BalanceResult`](/api/core/src/interfaces/balanceresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:185](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L185)

Query the remaining balance/points for the provider account.

#### Parameters

##### query?

[`BalanceQuery`](/api/core/src/interfaces/balancequery/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`BalanceResult`](/api/core/src/interfaces/balanceresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
