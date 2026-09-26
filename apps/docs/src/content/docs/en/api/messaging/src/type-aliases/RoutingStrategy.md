---
editUrl: false
next: false
prev: false
title: "RoutingStrategy"
---

> **RoutingStrategy** = `"first"` \| `"round_robin"`

Defined in: [packages/messaging/src/k-msg.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L46)

Routing strategy for selecting providers when multiple candidates are available.

- `"first"`: Always select the first available provider (default)
- `"round_robin"`: Distribute requests across providers in rotation
