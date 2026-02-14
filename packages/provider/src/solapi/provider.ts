import { type StandardRequest, UniversalProvider } from "@k-msg/core";
import { SolapiAdapter, type SolapiSdkClient } from "../adapters/solapi.adapter";
import type { SolapiConfig } from "./types/solapi";

export class SolapiProvider extends UniversalProvider {
  constructor(config: SolapiConfig, client?: SolapiSdkClient) {
    const adapter = new SolapiAdapter(config, client);
    super(adapter, {
      id: "solapi",
      name: "SOLAPI Messaging Provider",
      version: "1.0.0",
    });
  }

  async send(params: StandardRequest | any): Promise<any> {
    const adapter = this.getAdapter() as SolapiAdapter;

    if (isStandardRequest(params)) {
      return adapter.sendStandard(params);
    }

    // Default to StandardRequest path for best-effort compatibility.
    return adapter.sendStandard(params as StandardRequest);
  }

  async getBalance(): Promise<number> {
    return (this.getAdapter() as SolapiAdapter).getBalance();
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStandardRequest(value: unknown): value is StandardRequest {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.templateCode === "string" &&
    typeof value.phoneNumber === "string" &&
    typeof value.variables === "object" &&
    value.variables !== null
  );
}

export const createSolapiProvider = (config: SolapiConfig) =>
  new SolapiProvider(config);

export const createDefaultSolapiProvider = () => {
  const config: SolapiConfig = {
    apiKey: process.env.SOLAPI_API_KEY || "",
    apiSecret: process.env.SOLAPI_API_SECRET || "",
    baseUrl: process.env.SOLAPI_BASE_URL || "https://api.solapi.com",
    defaultFrom: process.env.SOLAPI_DEFAULT_FROM,
    kakaoPfId: process.env.SOLAPI_KAKAO_PF_ID,
    rcsBrandId: process.env.SOLAPI_RCS_BRAND_ID,
    appId: process.env.SOLAPI_APP_ID,
    defaultCountry: process.env.SOLAPI_DEFAULT_COUNTRY,
    debug: process.env.NODE_ENV === "development",
  };

  if (!config.apiKey || !config.apiSecret) {
    throw new Error(
      "SOLAPI_API_KEY and SOLAPI_API_SECRET environment variables are required",
    );
  }

  return createSolapiProvider(config);
};

export class SolapiProviderFactory {
  static create(config: SolapiConfig): SolapiProvider {
    return new SolapiProvider(config);
  }

  static createDefault(): SolapiProvider {
    return createDefaultSolapiProvider();
  }
}

export function initializeSolapi(): void {}

