---
title: "@k-msg/channel"
description: "Generated from `packages/channel/README.md`"
---
Runtime-first Kakao channel orchestration for `k-msg`.

## Installation

```bash
npm install @k-msg/channel @k-msg/core
# or
bun add @k-msg/channel @k-msg/core
```

## Runtime API (`@k-msg/channel`)

Root exports are runtime-focused:

- `KakaoChannelCapabilityService`
- `KakaoChannelBindingResolver`
- `KakaoChannelLifecycleService`
- runtime types (`KakaoChannelCapabilityMode`, `KakaoChannelBinding`, `ResolvedKakaoChannelBinding`, `KakaoChannelListItem`, ...)

### Capability modes

- `api`: provider exposes channel onboarding APIs (`list/auth/add/categories`)
- `manual`: provider requires manual onboarding (no channel onboarding API calls)
- `none`: provider does not support channel onboarding APIs

### Example: resolve config binding

```ts
import { KakaoChannelBindingResolver } from "@k-msg/channel";

const resolver = new KakaoChannelBindingResolver(config);

const resolved = resolver.resolve({
  providerId: "solapi-main",
  channelAlias: "main",
  senderKey: undefined,
  plusId: undefined,
});

// precedence: explicit > alias > defaults > provider config
console.log(resolved.senderKey, resolved.plusId);
```

### Example: provider lifecycle calls

```ts
import { KakaoChannelLifecycleService } from "@k-msg/channel";

const service = new KakaoChannelLifecycleService(provider);

const channels = await service.list();
if (channels.isSuccess) {
  console.log(channels.value); // KakaoChannelListItem[] with source="api"
}
```

## Toolkit API (`@k-msg/channel/toolkit`)

In-memory channel/sender helpers are now toolkit-only exports:

- `KakaoChannelManager`
- `KakaoSenderNumberManager`
- `ChannelCRUD`
- `PermissionManager`
- `ChannelService`
- verification helpers and legacy channel types

```ts
import { KakaoChannelManager } from "@k-msg/channel/toolkit";
```

## License

MIT

