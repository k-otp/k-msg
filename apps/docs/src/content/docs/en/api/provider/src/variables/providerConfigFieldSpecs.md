---
editUrl: false
next: false
prev: false
title: "providerConfigFieldSpecs"
---

> `const` **providerConfigFieldSpecs**: `object`

Defined in: [packages/provider/src/config-fields.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/config-fields.ts#L16)

## Type Declaration

### aligo

> `readonly` **aligo**: `object`

#### aligo.alimtalkBaseUrl

> `readonly` **alimtalkBaseUrl**: `object`

#### aligo.alimtalkBaseUrl.description

> `readonly` **description**: `"Override AlimTalk API base URL"` = `"Override AlimTalk API base URL"`

#### aligo.alimtalkBaseUrl.type

> `readonly` **type**: `"string"` = `"string"`

#### aligo.apiKey

> `readonly` **apiKey**: `object`

#### aligo.apiKey.defaultValue

> `readonly` **defaultValue**: `"env:ALIGO_API_KEY"` = `"env:ALIGO_API_KEY"`

#### aligo.apiKey.description

> `readonly` **description**: `"Aligo API key"` = `"Aligo API key"`

#### aligo.apiKey.required

> `readonly` **required**: `true` = `true`

#### aligo.apiKey.type

> `readonly` **type**: `"string"` = `"string"`

#### aligo.debug

> `readonly` **debug**: `object`

#### aligo.debug.description

> `readonly` **description**: `"Enable debug logging"` = `"Enable debug logging"`

#### aligo.debug.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### aligo.friendtalkEndpoint

> `readonly` **friendtalkEndpoint**: `object`

#### aligo.friendtalkEndpoint.description

> `readonly` **description**: `"Override FriendTalk endpoint path"` = `"Override FriendTalk endpoint path"`

#### aligo.friendtalkEndpoint.type

> `readonly` **type**: `"string"` = `"string"`

#### aligo.sender

> `readonly` **sender**: `object`

#### aligo.sender.defaultValue

> `readonly` **defaultValue**: `"env:ALIGO_SENDER"` = `"env:ALIGO_SENDER"`

#### aligo.sender.description

> `readonly` **description**: `"Default SMS/LMS sender number"` = `"Default SMS/LMS sender number"`

#### aligo.sender.type

> `readonly` **type**: `"string"` = `"string"`

#### aligo.senderKey

> `readonly` **senderKey**: `object`

#### aligo.senderKey.defaultValue

> `readonly` **defaultValue**: `"env:ALIGO_SENDER_KEY"` = `"env:ALIGO_SENDER_KEY"`

#### aligo.senderKey.description

> `readonly` **description**: `"Default Kakao sender key"` = `"Default Kakao sender key"`

#### aligo.senderKey.type

> `readonly` **type**: `"string"` = `"string"`

#### aligo.smsBaseUrl

> `readonly` **smsBaseUrl**: `object`

#### aligo.smsBaseUrl.description

> `readonly` **description**: `"Override SMS API base URL"` = `"Override SMS API base URL"`

#### aligo.smsBaseUrl.type

> `readonly` **type**: `"string"` = `"string"`

#### aligo.testMode

> `readonly` **testMode**: `object`

#### aligo.testMode.description

> `readonly` **description**: `"Enable Aligo test mode"` = `"Enable Aligo test mode"`

#### aligo.testMode.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### aligo.userId

> `readonly` **userId**: `object`

#### aligo.userId.defaultValue

> `readonly` **defaultValue**: `"env:ALIGO_USER_ID"` = `"env:ALIGO_USER_ID"`

#### aligo.userId.description

> `readonly` **description**: `"Aligo user id"` = `"Aligo user id"`

#### aligo.userId.required

> `readonly` **required**: `true` = `true`

#### aligo.userId.type

> `readonly` **type**: `"string"` = `"string"`

### iwinv

> `readonly` **iwinv**: `object`

#### iwinv.apiKey

> `readonly` **apiKey**: `object`

#### iwinv.apiKey.defaultValue

> `readonly` **defaultValue**: `"env:IWINV_API_KEY"` = `"env:IWINV_API_KEY"`

#### iwinv.apiKey.description

> `readonly` **description**: `"IWINV AlimTalk API key (AUTH header)"` = `"IWINV AlimTalk API key (AUTH header)"`

#### iwinv.apiKey.required

> `readonly` **required**: `true` = `true`

#### iwinv.apiKey.type

> `readonly` **type**: `"string"` = `"string"`

#### iwinv.debug

> `readonly` **debug**: `object`

#### iwinv.debug.description

> `readonly` **description**: `"Enable debug logging"` = `"Enable debug logging"`

#### iwinv.debug.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### iwinv.extraHeaders

> `readonly` **extraHeaders**: `object`

#### iwinv.extraHeaders.description

> `readonly` **description**: `"Additional HTTP headers"` = `"Additional HTTP headers"`

#### iwinv.extraHeaders.type

> `readonly` **type**: `"stringRecord"` = `"stringRecord"`

#### iwinv.ipAlertWebhookUrl

> `readonly` **ipAlertWebhookUrl**: `object`

#### iwinv.ipAlertWebhookUrl.description

> `readonly` **description**: `"Webhook URL for IP restriction alerts"` = `"Webhook URL for IP restriction alerts"`

#### iwinv.ipAlertWebhookUrl.type

> `readonly` **type**: `"string"` = `"string"`

#### iwinv.ipRetryCount

> `readonly` **ipRetryCount**: `object`

#### iwinv.ipRetryCount.description

> `readonly` **description**: `"IP-restriction retry count"` = `"IP-restriction retry count"`

#### iwinv.ipRetryCount.type

> `readonly` **type**: `"number"` = `"number"`

#### iwinv.ipRetryDelayMs

> `readonly` **ipRetryDelayMs**: `object`

#### iwinv.ipRetryDelayMs.description

> `readonly` **description**: `"IP-restriction retry delay in ms"` = `"IP-restriction retry delay in ms"`

#### iwinv.ipRetryDelayMs.type

> `readonly` **type**: `"number"` = `"number"`

#### iwinv.sendEndpoint

> `readonly` **sendEndpoint**: `object`

#### iwinv.sendEndpoint.description

> `readonly` **description**: `"Override IWINV send endpoint path"` = `"Override IWINV send endpoint path"`

#### iwinv.sendEndpoint.type

> `readonly` **type**: `"string"` = `"string"`

#### iwinv.senderNumber

> `readonly` **senderNumber**: `object`

#### iwinv.senderNumber.defaultValue

> `readonly` **defaultValue**: `"env:IWINV_SENDER_NUMBER"` = `"env:IWINV_SENDER_NUMBER"`

#### iwinv.senderNumber.description

> `readonly` **description**: `"Default sender number"` = `"Default sender number"`

#### iwinv.senderNumber.type

> `readonly` **type**: `"string"` = `"string"`

#### iwinv.smsApiKey

> `readonly` **smsApiKey**: `object`

#### iwinv.smsApiKey.defaultValue

> `readonly` **defaultValue**: `"env:IWINV_SMS_API_KEY"` = `"env:IWINV_SMS_API_KEY"`

#### iwinv.smsApiKey.description

> `readonly` **description**: `"IWINV SMS API key"` = `"IWINV SMS API key"`

#### iwinv.smsApiKey.type

> `readonly` **type**: `"string"` = `"string"`

#### iwinv.smsAuthKey

> `readonly` **smsAuthKey**: `object`

#### iwinv.smsAuthKey.defaultValue

> `readonly` **defaultValue**: `"env:IWINV_SMS_AUTH_KEY"` = `"env:IWINV_SMS_AUTH_KEY"`

#### iwinv.smsAuthKey.description

> `readonly` **description**: `"IWINV SMS auth key"` = `"IWINV SMS auth key"`

#### iwinv.smsAuthKey.type

> `readonly` **type**: `"string"` = `"string"`

#### iwinv.smsCompanyId

> `readonly` **smsCompanyId**: `object`

#### iwinv.smsCompanyId.defaultValue

> `readonly` **defaultValue**: `"env:IWINV_SMS_COMPANY_ID"` = `"env:IWINV_SMS_COMPANY_ID"`

#### iwinv.smsCompanyId.description

> `readonly` **description**: `"IWINV SMS company id"` = `"IWINV SMS company id"`

#### iwinv.smsCompanyId.type

> `readonly` **type**: `"string"` = `"string"`

#### iwinv.smsSenderNumber

> `readonly` **smsSenderNumber**: `object`

#### iwinv.smsSenderNumber.description

> `readonly` **description**: `"SMS/LMS sender number override"` = `"SMS/LMS sender number override"`

#### iwinv.smsSenderNumber.type

> `readonly` **type**: `"string"` = `"string"`

#### iwinv.xForwardedFor

> `readonly` **xForwardedFor**: `object`

#### iwinv.xForwardedFor.description

> `readonly` **description**: `"X-Forwarded-For header override"` = `"X-Forwarded-For header override"`

#### iwinv.xForwardedFor.type

> `readonly` **type**: `"string"` = `"string"`

### mock

> `readonly` **mock**: `object` = `{}`

### solapi

> `readonly` **solapi**: `object`

#### solapi.apiKey

> `readonly` **apiKey**: `object`

#### solapi.apiKey.defaultValue

> `readonly` **defaultValue**: `"env:SOLAPI_API_KEY"` = `"env:SOLAPI_API_KEY"`

#### solapi.apiKey.description

> `readonly` **description**: `"SOLAPI API key"` = `"SOLAPI API key"`

#### solapi.apiKey.required

> `readonly` **required**: `true` = `true`

#### solapi.apiKey.type

> `readonly` **type**: `"string"` = `"string"`

#### solapi.apiSecret

> `readonly` **apiSecret**: `object`

#### solapi.apiSecret.defaultValue

> `readonly` **defaultValue**: `"env:SOLAPI_API_SECRET"` = `"env:SOLAPI_API_SECRET"`

#### solapi.apiSecret.description

> `readonly` **description**: `"SOLAPI API secret"` = `"SOLAPI API secret"`

#### solapi.apiSecret.required

> `readonly` **required**: `true` = `true`

#### solapi.apiSecret.type

> `readonly` **type**: `"string"` = `"string"`

#### solapi.appId

> `readonly` **appId**: `object`

#### solapi.appId.description

> `readonly` **description**: `"SOLAPI app id"` = `"SOLAPI app id"`

#### solapi.appId.type

> `readonly` **type**: `"string"` = `"string"`

#### solapi.baseUrl

> `readonly` **baseUrl**: `object`

#### solapi.baseUrl.description

> `readonly` **description**: `"Override SOLAPI API base URL"` = `"Override SOLAPI API base URL"`

#### solapi.baseUrl.type

> `readonly` **type**: `"string"` = `"string"`

#### solapi.debug

> `readonly` **debug**: `object`

#### solapi.debug.description

> `readonly` **description**: `"Enable debug logging"` = `"Enable debug logging"`

#### solapi.debug.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### solapi.defaultCountry

> `readonly` **defaultCountry**: `object`

#### solapi.defaultCountry.description

> `readonly` **description**: `"Default country code"` = `"Default country code"`

#### solapi.defaultCountry.type

> `readonly` **type**: `"string"` = `"string"`

#### solapi.defaultFrom

> `readonly` **defaultFrom**: `object`

#### solapi.defaultFrom.defaultValue

> `readonly` **defaultValue**: `"env:SOLAPI_DEFAULT_FROM"` = `"env:SOLAPI_DEFAULT_FROM"`

#### solapi.defaultFrom.description

> `readonly` **description**: `"Default sender number"` = `"Default sender number"`

#### solapi.defaultFrom.type

> `readonly` **type**: `"string"` = `"string"`

#### solapi.kakaoPfId

> `readonly` **kakaoPfId**: `object`

#### solapi.kakaoPfId.defaultValue

> `readonly` **defaultValue**: `"env:SOLAPI_KAKAO_PF_ID"` = `"env:SOLAPI_KAKAO_PF_ID"`

#### solapi.kakaoPfId.description

> `readonly` **description**: `"Default Kakao PF ID"` = `"Default Kakao PF ID"`

#### solapi.kakaoPfId.type

> `readonly` **type**: `"string"` = `"string"`

#### solapi.naverTalkId

> `readonly` **naverTalkId**: `object`

#### solapi.naverTalkId.description

> `readonly` **description**: `"Default Naver Talk id"` = `"Default Naver Talk id"`

#### solapi.naverTalkId.type

> `readonly` **type**: `"string"` = `"string"`

#### solapi.rcsBrandId

> `readonly` **rcsBrandId**: `object`

#### solapi.rcsBrandId.description

> `readonly` **description**: `"Default RCS brand id"` = `"Default RCS brand id"`

#### solapi.rcsBrandId.type

> `readonly` **type**: `"string"` = `"string"`
