import { readRuntimeEnv } from "@k-msg/core";
import type { IWINVConfig } from "./types/iwinv";

/**
 * Reads the IWINV config from the runtime environment. It lives apart from the
 * send provider so the template entry point (`@k-msg/provider/iwinv/template`)
 * does not bundle the send code to read it.
 */
export function resolveDefaultIWINVConfig(): IWINVConfig {
  return {
    apiKey: readRuntimeEnv("IWINV_API_KEY") || "",
    smsApiKey: readRuntimeEnv("IWINV_SMS_API_KEY"),
    smsAuthKey: readRuntimeEnv("IWINV_SMS_AUTH_KEY"),
    smsCompanyId: readRuntimeEnv("IWINV_SMS_COMPANY_ID"),
    senderNumber:
      readRuntimeEnv("IWINV_SENDER_NUMBER") ||
      readRuntimeEnv("IWINV_SMS_SENDER_NUMBER"),
    smsSenderNumber: readRuntimeEnv("IWINV_SMS_SENDER_NUMBER"),
    sendEndpoint: readRuntimeEnv("IWINV_SEND_ENDPOINT") || "/api/v2/send/",
    xForwardedFor: readRuntimeEnv("IWINV_X_FORWARDED_FOR"),
    debug: readRuntimeEnv("NODE_ENV") === "development",
  };
}
