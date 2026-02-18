export type ProviderConfigFieldType =
  | "string"
  | "number"
  | "boolean"
  | "stringRecord";

export interface ProviderConfigFieldSpec {
  type: ProviderConfigFieldType;
  required?: boolean;
  description?: string;
  defaultValue?: string;
}

export type ProviderConfigFieldMap = Record<string, ProviderConfigFieldSpec>;

export const providerConfigFieldSpecs = {
  mock: {},
  aligo: {
    apiKey: {
      type: "string",
      required: true,
      description: "Aligo API key",
      defaultValue: "env:ALIGO_API_KEY",
    },
    userId: {
      type: "string",
      required: true,
      description: "Aligo user id",
      defaultValue: "env:ALIGO_USER_ID",
    },
    senderKey: {
      type: "string",
      description: "Default Kakao sender key",
      defaultValue: "env:ALIGO_SENDER_KEY",
    },
    sender: {
      type: "string",
      description: "Default SMS/LMS sender number",
      defaultValue: "env:ALIGO_SENDER",
    },
    testMode: {
      type: "boolean",
      description: "Enable Aligo test mode",
    },
    debug: {
      type: "boolean",
      description: "Enable debug logging",
    },
    smsBaseUrl: {
      type: "string",
      description: "Override SMS API base URL",
    },
    alimtalkBaseUrl: {
      type: "string",
      description: "Override AlimTalk API base URL",
    },
    friendtalkEndpoint: {
      type: "string",
      description: "Override FriendTalk endpoint path",
    },
  },
  iwinv: {
    apiKey: {
      type: "string",
      required: true,
      description: "IWINV AlimTalk API key (AUTH header)",
      defaultValue: "env:IWINV_API_KEY",
    },
    smsApiKey: {
      type: "string",
      description: "IWINV SMS API key",
      defaultValue: "env:IWINV_SMS_API_KEY",
    },
    smsAuthKey: {
      type: "string",
      description: "IWINV SMS auth key",
      defaultValue: "env:IWINV_SMS_AUTH_KEY",
    },
    smsCompanyId: {
      type: "string",
      description: "IWINV SMS company id",
      defaultValue: "env:IWINV_SMS_COMPANY_ID",
    },
    senderNumber: {
      type: "string",
      description: "Default sender number",
      defaultValue: "env:IWINV_SENDER_NUMBER",
    },
    smsSenderNumber: {
      type: "string",
      description: "SMS/LMS sender number override",
    },
    sendEndpoint: {
      type: "string",
      description: "Override IWINV send endpoint path",
    },
    xForwardedFor: {
      type: "string",
      description: "X-Forwarded-For header override",
    },
    extraHeaders: {
      type: "stringRecord",
      description: "Additional HTTP headers",
    },
    ipRetryCount: {
      type: "number",
      description: "IP-restriction retry count",
    },
    ipRetryDelayMs: {
      type: "number",
      description: "IP-restriction retry delay in ms",
    },
    ipAlertWebhookUrl: {
      type: "string",
      description: "Webhook URL for IP restriction alerts",
    },
    debug: {
      type: "boolean",
      description: "Enable debug logging",
    },
  },
  solapi: {
    apiKey: {
      type: "string",
      required: true,
      description: "SOLAPI API key",
      defaultValue: "env:SOLAPI_API_KEY",
    },
    apiSecret: {
      type: "string",
      required: true,
      description: "SOLAPI API secret",
      defaultValue: "env:SOLAPI_API_SECRET",
    },
    defaultFrom: {
      type: "string",
      description: "Default sender number",
      defaultValue: "env:SOLAPI_DEFAULT_FROM",
    },
    kakaoPfId: {
      type: "string",
      description: "Default Kakao PF ID",
      defaultValue: "env:SOLAPI_KAKAO_PF_ID",
    },
    rcsBrandId: {
      type: "string",
      description: "Default RCS brand id",
    },
    naverTalkId: {
      type: "string",
      description: "Default Naver Talk id",
    },
    appId: {
      type: "string",
      description: "SOLAPI app id",
    },
    defaultCountry: {
      type: "string",
      description: "Default country code",
    },
    baseUrl: {
      type: "string",
      description: "Override SOLAPI API base URL",
    },
    debug: {
      type: "boolean",
      description: "Enable debug logging",
    },
  },
} as const satisfies Record<string, ProviderConfigFieldMap>;

export type ProviderTypeWithConfig = keyof typeof providerConfigFieldSpecs;
