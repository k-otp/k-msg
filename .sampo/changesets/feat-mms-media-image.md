---
npm/k-msg: minor
npm/@k-msg/core: minor
npm/@k-msg/provider: minor
---

Add extensible `media.image` binary inputs to core send options and implement MMS support:
- IWINV MMS v2 via multipart/form-data with `secret` header
- SOLAPI accepts `media.image.ref` as an alias for `imageUrl` (MMS/FriendTalk/RCS_MMS)
