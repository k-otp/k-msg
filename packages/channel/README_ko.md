# @k-msg/channel

> 공식 문서: [k-msg.and.guide](https://k-msg.and.guide)

`k-msg`의 Kakao 채널 처리를 위한 런타임 중심 패키지입니다.

## 설치

```bash
npm install @k-msg/channel @k-msg/core
# or
bun add @k-msg/channel @k-msg/core
```

## 런타임 API (`@k-msg/channel`)

루트 export는 런타임 전용입니다.

- `KakaoChannelCapabilityService`
- `KakaoChannelBindingResolver`
- `KakaoChannelLifecycleService`
- 런타임 타입 (`KakaoChannelCapabilityMode`, `KakaoChannelBinding`, `ResolvedKakaoChannelBinding`, `KakaoChannelListItem` 등)

### capability 모드

- `api`: provider가 채널 온보딩 API(`list/auth/add/categories`)를 제공
- `manual`: 수동 온보딩 모델(채널 온보딩 API 호출 불가)
- `none`: 채널 온보딩 API 자체를 제공하지 않음

### 예시: 바인딩 해석

```ts
import { KakaoChannelBindingResolver } from "@k-msg/channel";

const resolver = new KakaoChannelBindingResolver(config);

const resolved = resolver.resolve({
  providerId: "solapi-main",
  channelAlias: "main",
});

// 우선순위: explicit > alias > defaults > provider config
console.log(resolved.senderKey, resolved.plusId);
```

### 예시: provider lifecycle 호출

```ts
import { KakaoChannelLifecycleService } from "@k-msg/channel";

const service = new KakaoChannelLifecycleService(provider);

const channels = await service.list();
if (channels.isSuccess) {
  console.log(channels.value); // source="api" 포함 KakaoChannelListItem[]
}
```

## Toolkit API (`@k-msg/channel/toolkit`)

기존 in-memory/관리 도구는 toolkit 서브패스로 분리되었습니다.

- `KakaoChannelManager`
- `KakaoSenderNumberManager`
- `ChannelCRUD`
- `PermissionManager`
- `ChannelService`
- 검증 유틸 및 레거시 channel 타입

```ts
import { KakaoChannelManager } from "@k-msg/channel/toolkit";
```

## 라이선스

MIT
