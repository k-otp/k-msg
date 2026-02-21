---
npm/@k-msg/channel: minor
npm/@k-msg/cli: minor
---

Refactor Kakao channel handling around `@k-msg/channel` runtime services and redesign CLI channel commands.

## `@k-msg/channel` (minor)

- split exports into runtime-first root API and toolkit-only subpath (`@k-msg/channel/toolkit`)
- add runtime services:
  - `KakaoChannelCapabilityService`
  - `KakaoChannelBindingResolver`
  - `KakaoChannelLifecycleService`
- add runtime channel binding/capability types:
  - `KakaoChannelCapabilityMode`
  - `KakaoChannelBinding`
  - `ResolvedKakaoChannelBinding`
  - `KakaoChannelListItem`
- add provider adapter flow for mode-specific handling (`aligo`, `iwinv`, `solapi`, `mock`)

## `@k-msg/cli` (minor)

- replace legacy `kakao channel` direct provider flow with channel runtime services
- add `kakao channel binding` command group:
  - `list`, `resolve`, `set`, `delete`
- add `kakao channel api` command group:
  - `categories`, `list`, `auth`, `add`
- remove legacy `kakao channel categories|list|auth|add` behavior and return guided migration errors
- unify senderKey/plusId resolution with channel binding resolver (including provider config hints such as `solapi.kakaoPfId`)
