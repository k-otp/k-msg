---
editUrl: false
next: false
prev: false
title: "SendOptions"
---

> **SendOptions** = [`SmsSendOptions`](/api/core/src/interfaces/smssendoptions/) \| [`AlimTalkSendOptions`](/api/core/src/interfaces/alimtalksendoptions/) \| [`FriendTalkSendOptions`](/api/core/src/interfaces/friendtalksendoptions/) \| [`NsaSendOptions`](/api/core/src/interfaces/nsasendoptions/) \| [`VoiceMessageSendOptions`](/api/core/src/interfaces/voicemessagesendoptions/) \| [`FaxMessageSendOptions`](/api/core/src/interfaces/faxmessagesendoptions/) \| [`RcsTextSendOptions`](/api/core/src/interfaces/rcstextsendoptions/) \| [`RcsTemplateSendOptions`](/api/core/src/interfaces/rcstemplatesendoptions/)

Defined in: [packages/core/src/types/message.ts:307](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L307)

Union of all supported send option types.
Use this for type narrowing based on the `type` discriminator.
