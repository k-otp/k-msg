---
editUrl: false
next: false
prev: false
title: "SendOptions"
---

> **SendOptions** = [`SmsSendOptions`](/en/api/core/src/interfaces/smssendoptions/) \| [`AlimTalkSendOptions`](/en/api/core/src/interfaces/alimtalksendoptions/) \| [`FriendTalkSendOptions`](/en/api/core/src/interfaces/friendtalksendoptions/) \| [`NsaSendOptions`](/en/api/core/src/interfaces/nsasendoptions/) \| [`VoiceMessageSendOptions`](/en/api/core/src/interfaces/voicemessagesendoptions/) \| [`FaxMessageSendOptions`](/en/api/core/src/interfaces/faxmessagesendoptions/) \| [`RcsTextSendOptions`](/en/api/core/src/interfaces/rcstextsendoptions/) \| [`RcsTemplateSendOptions`](/en/api/core/src/interfaces/rcstemplatesendoptions/)

Defined in: [packages/core/src/types/message.ts:330](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L330)

Union of all supported send option types.
Use this for type narrowing based on the `type` discriminator.
