---
editUrl: false
next: false
prev: false
title: "BalanceProvider"
---

Defined in: [packages/core/src/provider.ts:216](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L216)

Interface for providers that support balance queries.

## Methods

### getBalance()

> **getBalance**(`query?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`BalanceResult`](/en/api/core/src/interfaces/balanceresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:220](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L220)

Query the remaining balance/points for the provider account.

#### Parameters

##### query?

[`BalanceQuery`](/en/api/core/src/interfaces/balancequery/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`BalanceResult`](/en/api/core/src/interfaces/balanceresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
