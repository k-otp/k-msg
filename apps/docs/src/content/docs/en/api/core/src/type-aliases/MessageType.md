---
editUrl: false
next: false
prev: false
title: "MessageType"
---

> **MessageType** = `"ALIMTALK"` \| `"FRIENDTALK"` \| `"SMS"` \| `"LMS"` \| `"MMS"` \| `"NSA"` \| `"VOICE"` \| `"FAX"` \| `"RCS_SMS"` \| `"RCS_LMS"` \| `"RCS_MMS"` \| `"RCS_TPL"` \| `"RCS_ITPL"` \| `"RCS_LTPL"`

Defined in: [packages/core/src/types/message.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L15)

Supported message types in the k-msg platform.

- ALIMTALK: Kakao AlimTalk (notification talk) with approved template
- FRIENDTALK: Kakao FriendTalk (friend message, no template required)
- SMS: Short message (up to 90 bytes, typically ~90 Korean characters)
- LMS: Long message with subject line
- MMS: Multimedia message with image attachment
- NSA: Naver Smart Alarm (notification service)
- VOICE: Voice call message
- FAX: Fax transmission
- RCS_SMS/LMS/MMS: Rich Communication Services text/media messages
- RCS_TPL/ITPL/LTPL: RCS template-based messages
