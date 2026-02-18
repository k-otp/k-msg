export type ProviderConfigFieldType =
  | "string"
  | "number"
  | "boolean"
  | "stringRecord";

export interface ProviderConfigFieldSpec {
  type: ProviderConfigFieldType;
  required?: boolean;
  description?: string;
}

export type ProviderConfigFieldMap = Record<string, ProviderConfigFieldSpec>;

export const providerConfigFieldSpecs = {
  mock: {},
  aligo: {
    apiKey: {
      type: "string",
      required: true,
      description: "Aligo API key",
    },
    userId: {
      type: "string",
      required: true,
      description: "Aligo user id",
    },
    senderKey: {
      type: "string",
      description: "Default Kakao sender key",
    },
    sender: {
      type: "string",
      description: "Default SMS/LMS sender number",
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
    },
    smsApiKey: {
      type: "string",
      description: "IWINV SMS API key",
    },
    smsAuthKey: {
      type: "string",
      description: "IWINV SMS auth key",
    },
    smsCompanyId: {
      type: "string",
      description: "IWINV SMS company id",
    },
    senderNumber: {
      type: "string",
      description: "Default sender number",
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
    },
    apiSecret: {
      type: "string",
      required: true,
      description: "SOLAPI API secret",
    },
    defaultFrom: {
      type: "string",
      description: "Default sender number",
    },
    kakaoPfId: {
      type: "string",
      description: "Default Kakao PF ID",
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
