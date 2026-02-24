import {
  type BalanceProvider,
  type BalanceQuery,
  type BalanceResult,
  type DeliveryStatusQuery,
  type DeliveryStatusResult,
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  readRuntimeEnv,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import { SolapiMessageService } from "solapi";
import { getProviderOnboardingSpec } from "../onboarding/specs";
import { getSolapiDeliveryStatus } from "./solapi.delivery";
import { mapSolapiError } from "./solapi.error";
import type { SolapiSdkClient } from "./solapi.internal.types";
import { sendWithSolapi } from "./solapi.send";
import type { SolapiConfig } from "./types/solapi";

export class SolapiProvider implements Provider, BalanceProvider {
  readonly id = "solapi";
  readonly name = "SOLAPI Messaging Provider";
  readonly supportedTypes: readonly MessageType[] = [
    "ALIMTALK",
    "FRIENDTALK",
    "SMS",
    "LMS",
    "MMS",
    "NSA",
    "VOICE",
    "FAX",
    "RCS_SMS",
    "RCS_LMS",
    "RCS_MMS",
    "RCS_TPL",
    "RCS_ITPL",
    "RCS_LTPL",
  ];

  private readonly config: SolapiConfig;
  private readonly client: SolapiSdkClient;

  getOnboardingSpec() {
    const spec = getProviderOnboardingSpec(this.id);
    if (!spec) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        `Onboarding spec missing for provider: ${this.id}`,
        { providerId: this.id }
      );
  constructor(config: SolapiConfig, client?: SolapiSdkClient) {
    if (!config || typeof config !== "object") {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "SolapiProvider requires a config object",
        { providerId: this.id }
      );
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "SolapiProvider requires `apiKey` configuration",
        { providerId: this.id }
      );
    if (!config.apiSecret || config.apiSecret.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "SolapiProvider requires `apiSecret` configuration",
        { providerId: this.id }
      );
      client ??
      new SolapiMessageService(this.config.apiKey, this.config.apiSecret);
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const issues: string[] = [];
    const start = Date.now();

    try {
      if (!this.config.apiKey) issues.push("Missing apiKey");
      if (!this.config.apiSecret) issues.push("Missing apiSecret");
      if (this.config.baseUrl) {
        try {
          new URL(this.config.baseUrl);
        } catch {
          issues.push("Invalid baseUrl");
        }
      }

      return {
        healthy: issues.length === 0,
        issues,
        latencyMs: Date.now() - start,
        data: {
          provider: this.id,
          baseUrl: this.config.baseUrl,
        },
      };
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
      return { healthy: false, issues, latencyMs: Date.now() - start };
    }
  }

  async send(options: SendOptions): Promise<Result<SendResult, KMsgError>> {
    const messageId = options.messageId || crypto.randomUUID();
    const normalized = { ...options, messageId } as SendOptions;

    try {
      return await sendWithSolapi({
        providerId: this.id,
        client: this.client,
        config: this.config,
        options: normalized,
      });
    } catch (error) {
      return fail(mapSolapiError(error, this.id));
    }
  }

  async getDeliveryStatus(
    query: DeliveryStatusQuery,
  ): Promise<Result<DeliveryStatusResult | null, KMsgError>> {
    return getSolapiDeliveryStatus({
      providerId: this.id,
      client: this.client,
      query,
    });
  }

  async getBalance(
    query?: BalanceQuery,
  ): Promise<Result<BalanceResult, KMsgError>> {
    try {
      const raw = await this.client.getBalance();
      const source = raw as Record<string, unknown>;
      const amountCandidates = [source.balance, source.point];

      let amount = Number.NaN;
      for (const candidate of amountCandidates) {
        if (typeof candidate === "number" && Number.isFinite(candidate)) {
          amount = candidate;
          break;
        }
        if (typeof candidate === "string") {
          const numeric = Number(candidate);
          if (Number.isFinite(numeric)) {
            amount = numeric;
            break;
          }
        }
      }

      if (!Number.isFinite(amount)) {
        return fail(
          mapSolapiError(
            new Error("Invalid balance response from SOLAPI"),
            this.id,
          ),
        );
      }

      return ok({
        providerId: this.id,
        channel: query?.channel,
        amount,
        currency: "KRW",
        raw,
      });
    } catch (error) {
      return fail(mapSolapiError(error, this.id));
    }
  }
}

export const createSolapiProvider = (config: SolapiConfig) =>
  new SolapiProvider(config);

export const createDefaultSolapiProvider = () => {
  const config: SolapiConfig = {
    apiKey: readRuntimeEnv("SOLAPI_API_KEY") || "",
    apiSecret: readRuntimeEnv("SOLAPI_API_SECRET") || "",
    baseUrl: readRuntimeEnv("SOLAPI_BASE_URL") || "https://api.solapi.com",
    defaultFrom: readRuntimeEnv("SOLAPI_DEFAULT_FROM"),
    kakaoPfId: readRuntimeEnv("SOLAPI_KAKAO_PF_ID"),
    rcsBrandId: readRuntimeEnv("SOLAPI_RCS_BRAND_ID"),
    naverTalkId: readRuntimeEnv("SOLAPI_NAVER_TALK_ID"),
    appId: readRuntimeEnv("SOLAPI_APP_ID"),
    defaultCountry: readRuntimeEnv("SOLAPI_DEFAULT_COUNTRY"),
    debug: readRuntimeEnv("NODE_ENV") === "development",
  };

  if (!config.apiKey || !config.apiSecret) {
    throw new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "SOLAPI_API_KEY and SOLAPI_API_SECRET environment variables are required",
      { providerId: "solapi" }
    );
  return createSolapiProvider(config);
};

// biome-ignore lint/complexity/noStaticOnlyClass: kept as a factory for convenience
export class SolapiProviderFactory {
  static create(config: SolapiConfig): SolapiProvider {
    return new SolapiProvider(config);
  }

  static createDefault(): SolapiProvider {
    return createDefaultSolapiProvider();
  }
}

export function initializeSolapi(): void {}
